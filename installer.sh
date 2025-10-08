#!/sbin/sh
###########################################
# DariaOS GSI Flasher for Pixel 7 Pro Android 13
# Extended and Recoded for Complex Porting
# Last Updated : 2024, October 08
###########################################
#
ui_print() {
  echo "ui_print $1" > "$OUTFD";
  echo "ui_print" > "$OUTFD";
}

set_progress() { echo "set_progress $1" > "$OUTFD"; }

TMP="/tmp"
# Modified for DariaOS GSI on /sdcard
SYSTEM="/sdcard/dariaos_system.img"
PRODUCT="/sdcard/product.img"
VENDOR="/sdcard/vendor.img"
SYSTEM_EXT="/sdcard/system_ext.img"
BOOT="/sdcard/boot.img"
KERNEL="/sdcard/kernel.img"

set_progress 0.10;

ui_print "ENVIRONMENT SETUP"

# Device and Android Version Checks
device=$(getprop ro.product.device)
android_version=$(getprop ro.build.version.release)

ui_print "| Device: $device"
ui_print "| Android Version: $android_version"

if [ "$device" != "cheetah" ]; then
  ui_print "| Warning: This script is optimized for Pixel 7 Pro (cheetah)"
fi

if [ "$android_version" != "13" ]; then
  ui_print "| Warning: This script is designed for Android 13"
fi

ui_print "| Unmount System";
umount /system
umount /system_root
umount /system_ext
umount /product
umount /vendor

active_slot=`getprop ro.boot.slot_suffix`
dynamic=`getprop ro.boot.dynamic_partitions`

ui_print "| Detecting Partition Layout";

if [ "$dynamic" = "true" ]; then
  ui_print "| Dynamic partition detected";
  if [ ! -z "$active_slot" ]; then
    system_block=`ls -l /dev/block/mapper | grep system | grep -o '/dev/block/dm[^ ]*'`$active_slot
    product_block=`ls -l /dev/block/mapper | grep product | grep -o '/dev/block/dm[^ ]*'`$active_slot
    vendor_block=`ls -l /dev/block/mapper | grep vendor | grep -o '/dev/block/dm[^ ]*'`$active_slot
    system_ext_block=`ls -l /dev/block/mapper | grep system_ext | grep -o '/dev/block/dm[^ ]*'`$active_slot
		else
    system_block=`ls -l /dev/block/mapper | grep system | grep -o '/dev/block/dm[^ ]*'`
    product_block=`ls -l /dev/block/mapper | grep product | grep -o '/dev/block/dm[^ ]*'`
    vendor_block=`ls -l /dev/block/mapper | grep vendor | grep -o '/dev/block/dm[^ ]*'`
    system_ext_block=`ls -l /dev/block/mapper | grep system_ext | grep -o '/dev/block/dm[^ ]*'`
  fi
    ui_print "| System Block: $system_block";
	blockdev --setrw $system_block
	
	if [ ! -z "$product_block" ]; then
		ui_print "| Product Block: $product_block";
		blockdev --setrw $product_block
	fi
	
	if [ ! -z "$vendor_block" ]; then
		ui_print "| Vendor Block: $vendor_block";
		blockdev --setrw $vendor_block
	fi
	
	if [ ! -z "$system_ext_block" ]; then
		ui_print "| System_Ext Block: $system_ext_block";
		blockdev --setrw $system_ext_block
	fi

	# Boot partition detection
	if [ ! -z "$active_slot" ]; then
		boot_block="/dev/block/by-name/boot"$active_slot
	else
		boot_block="/dev/block/by-name/boot"
	fi
	ui_print "| Boot Block: $boot_block";

	# Kernel partition if available (for KernelSU)
	if [ -e "/dev/block/by-name/kernel" ]; then
		kernel_block="/dev/block/by-name/kernel"$active_slot
		ui_print "| Kernel Block: $kernel_block";
	fi

	else
	
  if [ ! -z "$active_slot" ]; then
    system_block=`cat /etc/recovery.fstab | grep -o '/dev/[^ ]*system' | cut -f -1 | head -1`$active_slot
    product_block=`cat /etc/recovery.fstab | grep -o '/dev/[^ ]*product' | cut -f -1 | head -1`$active_slot
    vendor_block=`cat /etc/recovery.fstab | grep -o '/dev/[^ ]*vendor' | cut -f -1 | head -1`$active_slot
    ui_print "| System Block: $system_block";
    
    if [ ! -z "$product_block" ]; then
    	ui_print "| Product Block: $product_block";
    fi
    
    if [ ! -z "$vendor_block" ]; then
    	ui_print "| Vendor Block: $vendor_block";
    fi

    # Boot partition for non-dynamic
    if [ ! -z "$active_slot" ]; then
      boot_block=`cat /etc/recovery.fstab | grep -o '/dev/[^ ]*boot' | cut -f -1 | head -1`$active_slot
    else
      boot_block=`cat /etc/recovery.fstab | grep -o '/dev/[^ ]*boot' | cut -f -1 | head -1`
    fi
    ui_print "| Boot Block: $boot_block";

  else
    system_block=`cat /etc/recovery.fstab | grep -o '/dev/[^ ]*system' | cut -f -1 | head -1`
    product_block=`cat /etc/recovery.fstab | grep -o '/dev/[^ ]*product' | cut -f -1 | head -1`
    vendor_block=`cat /etc/recovery.fstab | grep -o '/dev/[^ ]*vendor' | cut -f -1 | head -1`
    ui_print "| System Block: $system_block";
    
    if [ ! -z "$product_block" ]; then
    	ui_print "| Product Block: $product_block";
    fi
    
    if [ ! -z "$vendor_block" ]; then
    	ui_print "| Vendor Block: $vendor_block";
    fi

    boot_block=`cat /etc/recovery.fstab | grep -o '/dev/[^ ]*boot' | cut -f -1 | head -1`
    ui_print "| Boot Block: $boot_block";

  fi
fi

sleep 0.5;
set_progress 0.20;

OLD_LD_LIB=$LD_LIBRARY_PATH
OLD_LD_PRE=$LD_PRELOAD
OLD_LD_CFG=$LD_CONFIG_FILE
unset LD_LIBRARY_PATH
unset LD_PRELOAD
unset LD_CONFIG_FILE

ui_print " ";
ui_print "FLASHING SYSTEM IMAGE";
if [ -e $SYSTEM ] ; then
	if `simg2img $SYSTEM $system_block`; then
		ui_print "| System flashed as sparse image";
			else
		dd if=$SYSTEM of=$system_block bs=4096
		ui_print "| System flashed as raw image";
	fi
		ui_print "| Attempt to Resize Partition";
		blockdev --setrw $system_block
		$TMP/e2fsck -fy $system_block
		$TMP/resize2fs $system_block
		ui_print "| Done";
	else
		ui_print "| Cant find system.img";
fi

if [ ! -z "$product_block" ]; then
	ui_print " ";
	ui_print "FLASHING PRODUCT IMAGE";
	if [ -e $PRODUCT ] ; then
		if `simg2img $PRODUCT $product_block`; then
			ui_print "| Product flashed as sparse image";
				else
			dd if=$PRODUCT of=$product_block bs=4096
			ui_print "| Product flashed as raw image";
		fi
			ui_print "| Attempt to Resize Partition";
			blockdev --setrw $product_block
			$TMP/e2fsck -fy $product_block
			$TMP/resize2fs $product_block
			ui_print "| Done";
		else
			ui_print "| Cant find product.img";
	fi
fi

if [ ! -z "$vendor_block" ]; then
	ui_print " ";
	ui_print "FLASHING VENDOR IMAGE";
	if [ -e $VENDOR ] ; then
		if `simg2img $VENDOR $vendor_block`; then
			ui_print "| Vendor flashed as sparse image";
				else
			dd if=$VENDOR of=$vendor_block bs=4096
			ui_print "| Vendor flashed as raw image";
		fi
			ui_print "| Attempt to Resize Partition";
			blockdev --setrw $vendor_block
			$TMP/e2fsck -fy $vendor_block
			$TMP/resize2fs $vendor_block
			ui_print "| Done";
		else
			ui_print "| Cant find vendor.img";
	fi
fi

if [ ! -z "$system_ext_block" ]; then
	ui_print " ";
	ui_print "FLASHING SYSTEM_EXT IMAGE";
	if [ -e $SYSTEM_EXT ] ; then
		if `simg2img $SYSTEM_EXT $system_ext_block`; then
			ui_print "| System_ext flashed as sparse image";
				else
			dd if=$SYSTEM_EXT of=$system_ext_block bs=4096
			ui_print "| System_ext flashed as raw image";
		fi
			ui_print "| Attempt to Resize Partition";
			blockdev --setrw $system_ext_block
			$TMP/e2fsck -fy $system_ext_block
			$TMP/resize2fs $system_ext_block
			ui_print "| Done";
		else
			ui_print "| Cant find system_ext.img";
	fi
fi

# Flash Boot Image if present
ui_print " ";
ui_print "FLASHING BOOT IMAGE";
if [ -e $BOOT ]; then
  dd if=$BOOT of=$boot_block bs=4096
  ui_print "| Boot flashed";
else
  ui_print "| Boot image not found, skipping";
fi

# Flash Kernel Image if present (for KernelSU/SUSFS)
if [ ! -z "$kernel_block" ]; then
  ui_print " ";
  ui_print "FLASHING KERNEL IMAGE";
  if [ -e $KERNEL ]; then
    dd if=$KERNEL of=$kernel_block bs=4096
    ui_print "| Kernel flashed";
  else
    ui_print "| Kernel image not found, skipping";
  fi
fi

sleep 1.0
[ -z $OLD_LD_LIB ] || export LD_LIBRARY_PATH=$OLD_LD_LIB
[ -z $OLD_LD_PRE ] || export LD_PRELOAD=$OLD_LD_PRE
[ -z $OLD_LD_CFG ] || export LD_CONFIG_FILE=$OLD_LD_CFG
ui_print "| DariaOS GSI Installation Complete";
ui_print "| Reboot to enjoy your new system!";
ui_print " ";
set_progress 1.00;
