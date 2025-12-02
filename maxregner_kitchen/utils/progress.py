"""
Advanced Progress Tracking System

Comprehensive progress tracking with real-time updates, time estimation,
and GUI integration for the MaxRegner Kitchen Tool.
"""

import time
from datetime import datetime, timedelta
from typing import Optional, Callable, Dict, Any, List
from dataclasses import dataclass
from PyQt6.QtCore import QObject, pyqtSignal, QTimer


@dataclass
class ProgressStep:
    """Individual progress step information."""
    name: str
    weight: float = 1.0
    completed: bool = False
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    error: Optional[str] = None


class ProgressCallback:
    """Callback interface for progress updates."""
    
    def __init__(self, callback: Callable[[int, str], None]):
        self.callback = callback
    
    def update(self, percentage: int, message: str):
        """Update progress."""
        if self.callback:
            self.callback(percentage, message)


class ProgressTracker(QObject):
    """Advanced progress tracking with time estimation and GUI integration."""
    
    # Qt signals for GUI integration
    progress_updated = pyqtSignal(int, str, str)  # percentage, message, eta
    step_completed = pyqtSignal(str, float)       # step_name, duration
    operation_started = pyqtSignal(str)           # operation_name
    operation_completed = pyqtSignal(str, bool, float)  # operation_name, success, total_duration
    
    def __init__(self, operation_name: str = "Operation"):
        super().__init__()
        
        self.operation_name = operation_name
        self.steps: List[ProgressStep] = []
        self.current_step_index = 0
        self.start_time: Optional[datetime] = None
        self.end_time: Optional[datetime] = None
        
        # Progress calculation
        self.total_weight = 0.0
        self.completed_weight = 0.0
        
        # Time estimation
        self.step_durations: Dict[str, List[float]] = {}
        self.estimated_total_duration: Optional[float] = None
        
        # GUI update timer
        self.update_timer = QTimer()
        self.update_timer.timeout.connect(self._emit_progress_update)
        self.update_timer.setInterval(100)  # Update every 100ms
        
        # Callbacks
        self.callbacks: List[ProgressCallback] = []
        
        # State
        self.is_running = False
        self.is_paused = False
        self.current_message = ""
    
    def add_step(self, name: str, weight: float = 1.0) -> 'ProgressTracker':
        """Add a progress step."""
        step = ProgressStep(name=name, weight=weight)
        self.steps.append(step)
        self.total_weight += weight
        return self
    
    def add_steps(self, steps: List[tuple]) -> 'ProgressTracker':
        """Add multiple steps from list of (name, weight) tuples."""
        for step_info in steps:
            if len(step_info) == 2:
                name, weight = step_info
                self.add_step(name, weight)
            else:
                self.add_step(step_info[0])
        return self
    
    def add_callback(self, callback: Callable[[int, str], None]):
        """Add progress callback."""
        self.callbacks.append(ProgressCallback(callback))
    
    def start(self):
        """Start progress tracking."""
        self.start_time = datetime.now()
        self.is_running = True
        self.is_paused = False
        self.current_step_index = 0
        self.completed_weight = 0.0
        
        # Reset step states
        for step in self.steps:
            step.completed = False
            step.start_time = None
            step.end_time = None
            step.error = None
        
        self.operation_started.emit(self.operation_name)
        self.update_timer.start()
        
        self._update_progress(0, f"Starting {self.operation_name}...")
    
    def next_step(self, message: str = "") -> bool:
        """Move to the next step."""
        if not self.is_running or self.current_step_index >= len(self.steps):
            return False
        
        # Complete current step if it exists
        if self.current_step_index > 0:
            self._complete_current_step()
        
        # Start next step
        current_step = self.steps[self.current_step_index]
        current_step.start_time = datetime.now()
        
        step_message = message or f"Processing {current_step.name}..."
        self.current_message = step_message
        
        percentage = self._calculate_percentage()
        self._update_progress(percentage, step_message)
        
        return True
    
    def update_step_progress(self, sub_percentage: int, message: str = ""):
        """Update progress within the current step."""
        if not self.is_running or self.current_step_index >= len(self.steps):
            return
        
        current_step = self.steps[self.current_step_index]
        
        # Calculate overall percentage
        base_percentage = self._calculate_base_percentage()
        step_weight_percentage = (current_step.weight / self.total_weight) * 100
        step_contribution = (sub_percentage / 100) * step_weight_percentage
        
        total_percentage = int(base_percentage + step_contribution)
        
        step_message = message or f"Processing {current_step.name}... {sub_percentage}%"
        self.current_message = step_message
        
        self._update_progress(total_percentage, step_message)
    
    def complete_step(self, message: str = ""):
        """Complete the current step and move to next."""
        if not self.is_running:
            return
        
        self._complete_current_step()
        self.current_step_index += 1
        
        if self.current_step_index >= len(self.steps):
            # All steps completed
            self.complete(True, message or f"Completed {self.operation_name}")
        else:
            # Move to next step
            self.next_step(message)
    
    def skip_step(self, reason: str = ""):
        """Skip the current step."""
        if not self.is_running or self.current_step_index >= len(self.steps):
            return
        
        current_step = self.steps[self.current_step_index]
        current_step.completed = True
        current_step.end_time = datetime.now()
        current_step.error = f"Skipped: {reason}" if reason else "Skipped"
        
        self.completed_weight += current_step.weight
        self.current_step_index += 1
        
        if self.current_step_index >= len(self.steps):
            self.complete(True)
        else:
            self.next_step()
    
    def fail_step(self, error_message: str):
        """Fail the current step."""
        if not self.is_running or self.current_step_index >= len(self.steps):
            return
        
        current_step = self.steps[self.current_step_index]
        current_step.end_time = datetime.now()
        current_step.error = error_message
        
        self.complete(False, f"Failed at {current_step.name}: {error_message}")
    
    def pause(self):
        """Pause progress tracking."""
        self.is_paused = True
        self.update_timer.stop()
    
    def resume(self):
        """Resume progress tracking."""
        if self.is_paused:
            self.is_paused = False
            self.update_timer.start()
    
    def complete(self, success: bool = True, message: str = ""):
        """Complete the entire operation."""
        self.end_time = datetime.now()
        self.is_running = False
        self.update_timer.stop()
        
        if success:
            # Complete any remaining steps
            while self.current_step_index < len(self.steps):
                self._complete_current_step()
                self.current_step_index += 1
            
            final_message = message or f"Completed {self.operation_name}"
            self._update_progress(100, final_message)
        else:
            final_message = message or f"Failed {self.operation_name}"
            self._update_progress(-1, final_message)
        
        # Calculate total duration
        total_duration = (self.end_time - self.start_time).total_seconds() if self.start_time else 0
        
        self.operation_completed.emit(self.operation_name, success, total_duration)
    
    def _complete_current_step(self):
        """Complete the current step."""
        if self.current_step_index >= len(self.steps):
            return
        
        current_step = self.steps[self.current_step_index]
        current_step.completed = True
        current_step.end_time = datetime.now()
        
        # Calculate step duration
        if current_step.start_time:
            duration = (current_step.end_time - current_step.start_time).total_seconds()
            
            # Store duration for estimation
            if current_step.name not in self.step_durations:
                self.step_durations[current_step.name] = []
            self.step_durations[current_step.name].append(duration)
            
            self.step_completed.emit(current_step.name, duration)
        
        self.completed_weight += current_step.weight
    
    def _calculate_percentage(self) -> int:
        """Calculate current percentage."""
        if self.total_weight == 0:
            return 0
        
        return int((self.completed_weight / self.total_weight) * 100)
    
    def _calculate_base_percentage(self) -> float:
        """Calculate base percentage (completed steps only)."""
        if self.total_weight == 0:
            return 0.0
        
        return (self.completed_weight / self.total_weight) * 100
    
    def _estimate_remaining_time(self) -> Optional[str]:
        """Estimate remaining time based on historical data."""
        if not self.start_time or not self.is_running:
            return None
        
        elapsed = (datetime.now() - self.start_time).total_seconds()
        
        if self.completed_weight == 0:
            return None
        
        # Simple linear estimation
        progress_ratio = self.completed_weight / self.total_weight
        if progress_ratio > 0:
            estimated_total = elapsed / progress_ratio
            remaining = estimated_total - elapsed
            
            if remaining > 0:
                return self._format_duration(remaining)
        
        return None
    
    def _format_duration(self, seconds: float) -> str:
        """Format duration in human-readable format."""
        if seconds < 60:
            return f"{int(seconds)}s"
        elif seconds < 3600:
            minutes = int(seconds // 60)
            secs = int(seconds % 60)
            return f"{minutes}m {secs}s"
        else:
            hours = int(seconds // 3600)
            minutes = int((seconds % 3600) // 60)
            return f"{hours}h {minutes}m"
    
    def _update_progress(self, percentage: int, message: str):
        """Update progress and notify callbacks."""
        eta = self._estimate_remaining_time() or ""
        
        # Notify callbacks
        for callback in self.callbacks:
            callback.update(percentage, message)
        
        # Store current state for timer updates
        self.current_percentage = percentage
        self.current_message = message
        self.current_eta = eta
    
    def _emit_progress_update(self):
        """Emit progress update signal (called by timer)."""
        if hasattr(self, 'current_percentage'):
            eta = self._estimate_remaining_time() or ""
            self.progress_updated.emit(
                self.current_percentage,
                self.current_message,
                eta
            )
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get progress statistics."""
        stats = {
            'operation_name': self.operation_name,
            'total_steps': len(self.steps),
            'completed_steps': sum(1 for step in self.steps if step.completed),
            'failed_steps': sum(1 for step in self.steps if step.error and not step.error.startswith('Skipped')),
            'skipped_steps': sum(1 for step in self.steps if step.error and step.error.startswith('Skipped')),
            'is_running': self.is_running,
            'is_paused': self.is_paused,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
        }
        
        if self.start_time:
            end_time = self.end_time or datetime.now()
            stats['duration'] = (end_time - self.start_time).total_seconds()
        
        return stats
    
    def get_step_details(self) -> List[Dict[str, Any]]:
        """Get detailed information about all steps."""
        details = []
        
        for i, step in enumerate(self.steps):
            step_info = {
                'index': i,
                'name': step.name,
                'weight': step.weight,
                'completed': step.completed,
                'error': step.error,
                'start_time': step.start_time.isoformat() if step.start_time else None,
                'end_time': step.end_time.isoformat() if step.end_time else None,
            }
            
            if step.start_time and step.end_time:
                step_info['duration'] = (step.end_time - step.start_time).total_seconds()
            
            details.append(step_info)
        
        return details
    
    def reset(self):
        """Reset progress tracker for reuse."""
        self.current_step_index = 0
        self.start_time = None
        self.end_time = None
        self.completed_weight = 0.0
        self.is_running = False
        self.is_paused = False
        self.current_message = ""
        
        # Reset all steps
        for step in self.steps:
            step.completed = False
            step.start_time = None
            step.end_time = None
            step.error = None
        
        self.update_timer.stop()


class MultiOperationTracker(QObject):
    """Track multiple operations with overall progress."""
    
    overall_progress_updated = pyqtSignal(int, str)  # percentage, current_operation
    
    def __init__(self):
        super().__init__()
        
        self.operations: List[ProgressTracker] = []
        self.current_operation_index = 0
        self.total_weight = 0.0
        self.completed_weight = 0.0
    
    def add_operation(self, tracker: ProgressTracker, weight: float = 1.0):
        """Add an operation tracker."""
        self.operations.append(tracker)
        self.total_weight += weight
        
        # Connect to operation completion
        tracker.operation_completed.connect(self._on_operation_completed)
    
    def start(self):
        """Start all operations."""
        self.current_operation_index = 0
        self.completed_weight = 0.0
        
        if self.operations:
            self.operations[0].start()
    
    def _on_operation_completed(self, operation_name: str, success: bool, duration: float):
        """Handle operation completion."""
        if success:
            self.completed_weight += 1.0  # Assuming equal weights for simplicity
            self.current_operation_index += 1
            
            if self.current_operation_index < len(self.operations):
                # Start next operation
                self.operations[self.current_operation_index].start()
            else:
                # All operations completed
                self.overall_progress_updated.emit(100, "All operations completed")
        else:
            # Operation failed
            self.overall_progress_updated.emit(-1, f"Failed: {operation_name}")
    
    def get_overall_progress(self) -> int:
        """Get overall progress percentage."""
        if not self.operations:
            return 0
        
        return int((self.completed_weight / len(self.operations)) * 100)
