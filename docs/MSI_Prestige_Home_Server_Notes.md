# MSI Prestige Home Server — Setup Notes

**Date:** 2026-08-02  
**Server hostname:** `smrik-prestige`  
**Server username:** `smrik`  
**Server OS:** EndeavourOS KDE  
**Server filesystem:** `ext4`

## What we built

The old MSI Prestige 14 is now a small always-on home server for the Obsidian vault.

It currently provides:

- remote access over SSH through Tailscale
- live Obsidian vault replication with Syncthing
- Syncthing staggered file versioning on the MSI
- daily local Restic snapshots
- daily encrypted Restic backups to Google Drive through rclone
- automatic service startup after reboot
- lid-closed operation while plugged in

The tools solve different problems:

- **Syncthing** keeps the main laptop and server copy in sync.
- **Syncthing versioning** keeps older versions of changed or deleted files.
- **Local Restic** gives structured snapshots and restore points.
- **Google Drive Restic** protects against SSD failure, theft, or loss of the MSI.
- **Tailscale + SSH** allows private remote administration without router port forwarding.

---

## Important addresses and paths

### Tailscale SSH address

```text
100.119.153.70
```

### SSH login

```powershell
ssh smrik@100.119.153.70
```

### Server hostname

```text
smrik-prestige
```

### Obsidian vault paths

Main Windows laptop:

```text
C:\Patrik's Vault\PatriksVault
```

MSI server:

```text
/home/smrik/srv/RAM
```

### Local Restic repository

```text
/home/smrik/backups/restic-ram
```

### Google Drive Restic repository

```text
rclone:gdrive:Backups/MSI-RAM
```

### Restic password file

```text
/home/smrik/.config/restic/ram-password
```

The password itself is not written in this note. It should also remain saved separately in the password manager.

---

## Remote access

From the main laptop, connect with:

```powershell
ssh smrik@100.119.153.70
```

This works outside the home network as long as both devices are online, Tailscale is running on both, and the MSI remains powered on and connected to home Wi-Fi.

No router port forwarding is required.

### Confirm the remote machine

```bash
hostname
uptime
```

Expected hostname:

```text
smrik-prestige
```

### Check core services

```bash
systemctl is-active sshd tailscaled
systemctl --user is-active syncthing
```

Expected:

```text
active
active
active
```

### Confirm user services run without login

```bash
loginctl show-user smrik -p Linger
```

Expected:

```text
Linger=yes
```

---

## Syncthing

The vault is synced between the Windows laptop and the MSI server.

### Main laptop Syncthing GUI

```text
http://127.0.0.1:8384
```

### MSI Syncthing GUI through SSH tunnel

Run this on the Windows laptop:

```powershell
ssh -N -L 8385:127.0.0.1:8384 smrik@100.119.153.70
```

Then open:

```text
http://127.0.0.1:8385
```

Keep that PowerShell window open while using the tunnel.

### Current Syncthing setup

- both sides use **Send & Receive**
- the MSI uses **Staggered File Versioning**
- the main laptop does not need versioning
- both sides showed **Up to Date**
- vault size was approximately `894 MiB`
- initial sync contained roughly `2,455–2,463 files`

### Useful verification commands

```bash
find ~/srv/RAM -type f | wc -l
du -sh ~/srv/RAM
```

### Ignore patterns used

```text
(?d).obsidian/workspace.json
(?d).obsidian/workspace-mobile.json
(?d).obsidian/cache
(?d).trash
(?d).stversions
```

---

## Restic local backups

The local repository is:

```text
/home/smrik/backups/restic-ram
```

### List local snapshots

```bash
restic snapshots \
  --repo ~/backups/restic-ram \
  --password-file ~/.config/restic/ram-password
```

### Create a manual local backup

```bash
restic backup ~/srv/RAM \
  --repo ~/backups/restic-ram \
  --password-file ~/.config/restic/ram-password
```

### Check local repository integrity

```bash
restic check \
  --repo ~/backups/restic-ram \
  --password-file ~/.config/restic/ram-password
```

### Restore the latest snapshot

```bash
mkdir -p ~/restore-test

restic restore latest \
  --repo ~/backups/restic-ram \
  --password-file ~/.config/restic/ram-password \
  --target ~/restore-test
```

Restored files will appear below:

```text
/home/smrik/restore-test/home/smrik/srv/RAM/
```

Remove the test restore afterward:

```bash
rm -rf ~/restore-test
```

---

## Restic Google Drive backups

The encrypted cloud repository is:

```text
rclone:gdrive:Backups/MSI-RAM
```

Google Drive only sees encrypted Restic repository data, not readable vault files.

### List cloud snapshots

```bash
restic snapshots \
  --repo rclone:gdrive:Backups/MSI-RAM \
  --password-file ~/.config/restic/ram-password
```

### Create a manual cloud backup

```bash
restic backup /home/smrik/srv/RAM \
  --repo rclone:gdrive:Backups/MSI-RAM \
  --password-file ~/.config/restic/ram-password
```

### Check cloud repository integrity

```bash
restic check \
  --repo rclone:gdrive:Backups/MSI-RAM \
  --password-file ~/.config/restic/ram-password
```

### Verify rclone access

```bash
rclone lsd gdrive:
```

---

## Automated backups

### Local service and timer

```text
~/.config/systemd/user/restic-ram-backup.service
~/.config/systemd/user/restic-ram-backup.timer
```

### Cloud service and timer

```text
~/.config/systemd/user/restic-ram-cloud.service
~/.config/systemd/user/restic-ram-cloud.timer
```

### Check both timers

```bash
systemctl --user list-timers 'restic-ram-*'
```

### Check whether timers are enabled

```bash
systemctl --user is-enabled \
  restic-ram-backup.timer \
  restic-ram-cloud.timer
```

Expected:

```text
enabled
enabled
```

### Manually test local backup service

```bash
systemctl --user start restic-ram-backup.service
systemctl --user status restic-ram-backup.service --no-pager
```

### Manually test cloud backup service

```bash
systemctl --user start restic-ram-cloud.service
systemctl --user status restic-ram-cloud.service --no-pager
```

For these `Type=oneshot` services, this is normal after a successful run:

```text
Active: inactive (dead)
status=0/SUCCESS
```

The service starts, completes the backup, and exits. The timer remains active.

### Retention policy

The configured policy keeps:

```text
7 daily snapshots
4 weekly snapshots
12 monthly snapshots
```

---

## Useful troubleshooting commands

### View recent local backup logs

```bash
journalctl --user -u restic-ram-backup.service -n 100 --no-pager
```

### View recent cloud backup logs

```bash
journalctl --user -u restic-ram-cloud.service -n 100 --no-pager
```

### View Syncthing status

```bash
systemctl --user status syncthing --no-pager
```

### Restart Syncthing

```bash
systemctl --user restart syncthing
```

### Restart SSH or Tailscale

```bash
sudo systemctl restart sshd
sudo systemctl restart tailscaled
```

### Check Tailscale IP

```bash
tailscale ip -4
```

---

## Things to remember

1. **Syncthing is not a backup by itself.** It can also replicate deletions or damaged files.
2. **Local Restic is not enough by itself.** The source and local repository are on the same SSD.
3. **The Google Drive Restic repository is the true off-device copy.**
4. **The Restic password is essential.** Losing it means losing access to both repositories.
5. **Do not expose SSH directly to the public internet.** Keep using Tailscale.
6. **Leave the MSI plugged in, connected to Wi-Fi, and ventilated.**
7. **The lid can remain closed because suspend-on-lid-close was disabled.**
8. **Test restores occasionally.** A backup is only useful if restoration still works.

---

## Current verified state

- SSH over Tailscale: working
- remote access through a mobile hotspot: working
- Syncthing after reboot: working
- lid-closed server operation: working
- local Restic backup: working
- local restore test: working
- Google Drive Restic backup: working
- Google Drive repository check: no errors
- local and cloud timers: enabled
