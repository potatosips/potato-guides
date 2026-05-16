#!/bin/bash
set -e

IMAGE_NAME="rclone-backup"

ARCH=$(uname -m)
case "$ARCH" in
    x86_64)        PLATFORM="linux/amd64" ;;
    aarch64|arm64) PLATFORM="linux/arm64" ;;
    armv7l)        PLATFORM="linux/arm/v7" ;;
    armv6l)        PLATFORM="linux/arm/v6" ;;
    i386|i686)     PLATFORM="linux/386" ;;
    *) echo "Unsupported architecture: $ARCH" && exit 1 ;;
esac

echo "► Architecture : $ARCH ($PLATFORM)"

for cmd in git docker; do
    if ! command -v $cmd &>/dev/null; then
        echo "► Installing $cmd..."
        apt-get update -qq && apt-get install -y -qq $cmd
    fi
done

cat > /tmp/Dockerfile.rclone << 'DOCKERFILE'
FROM debian:stable-slim

RUN apt-get update && apt-get install -y \
    curl unzip zip tar ca-certificates tzdata cron \
    && rm -rf /var/lib/apt/lists/*

RUN ARCH=$(uname -m) && \
    case "$ARCH" in \
        x86_64)    RCLONE_ARCH="amd64" ;; \
        aarch64)   RCLONE_ARCH="arm64" ;; \
        armv7l)    RCLONE_ARCH="arm-v7" ;; \
        armv6l)    RCLONE_ARCH="arm-v6" ;; \
        i386|i686) RCLONE_ARCH="386" ;; \
        *) echo "Unsupported: $ARCH" && exit 1 ;; \
    esac && \
    curl -fsSL "https://downloads.rclone.org/rclone-current-linux-${RCLONE_ARCH}.zip" -o /tmp/rclone.zip && \
    cd /tmp && unzip rclone.zip && \
    mv rclone-*-linux-*/rclone /usr/local/bin/rclone && \
    chmod +x /usr/local/bin/rclone && \
    rm -rf /tmp/rclone*

RUN printf '#!/bin/bash\nset -e\n\
TIMESTAMP=$(date +"%%Y-%%m-%%d_%%H-%%M")\n\
ARCHIVE="/tmp/backup-$TIMESTAMP.zip"\n\
LOG="/var/log/vps-backup.log"\n\
log() { echo "[$(date +"%%Y-%%m-%%d %%H:%%M:%%S")] $1" | tee -a "$LOG"; }\n\
log "===== Backup started ====="\n\
ADJUSTED_PATHS=""\n\
for P in $BACKUP_PATHS; do ADJUSTED_PATHS="$ADJUSTED_PATHS /host$P"; done\n\
zip -0 -r "$ARCHIVE" $ADJUSTED_PATHS \\\n\
    --exclude "*/node_modules/*" --exclude "*/.cache/*" \\\n\
    --exclude "*.tmp" --exclude "*.sock" 2>>"$LOG"\n\
SIZE=$(du -sh "$ARCHIVE" | cut -f1)\n\
log "Archive: $(basename $ARCHIVE) ($SIZE)"\n\
rclone --config /config/rclone.conf copy "$ARCHIVE" "$GDRIVE_FOLDER" \\\n\
    --log-file="$LOG" --log-level INFO \\\n\
    && log "Upload OK" \\\n\
    || { log "Upload FAILED"; rm -f "$ARCHIVE"; exit 1; }\n\
rm -f "$ARCHIVE"\n\
COUNT=$(rclone --config /config/rclone.conf lsf "$GDRIVE_FOLDER" | wc -l)\n\
while [ "$COUNT" -gt "$KEEP_BACKUPS" ]; do\n\
    OLDEST=$(rclone --config /config/rclone.conf lsf "$GDRIVE_FOLDER" | sort | head -1)\n\
    rclone --config /config/rclone.conf delete "$GDRIVE_FOLDER/$OLDEST"\n\
    log "Pruned: $OLDEST"\n\
    COUNT=$(rclone --config /config/rclone.conf lsf "$GDRIVE_FOLDER" | wc -l)\n\
done\n\
log "===== Backup finished ====="\n' > /usr/local/bin/backup.sh

RUN printf '#!/bin/bash\n\
touch /var/log/vps-backup.log\n\
echo "$BACKUP_CRON root /usr/local/bin/backup.sh" > /etc/cron.d/vps-backup\n\
chmod 0644 /etc/cron.d/vps-backup\n\
echo "► Container started"\n\
echo "  Schedule : $BACKUP_CRON"\n\
echo "  Paths    : $BACKUP_PATHS"\n\
echo "  Remote   : $GDRIVE_FOLDER"\n\
echo "  Retain   : $KEEP_BACKUPS backups"\n\
cron && tail -f /var/log/vps-backup.log\n' > /entrypoint.sh

RUN chmod +x /usr/local/bin/backup.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
DOCKERFILE

echo "► Building image: $IMAGE_NAME:latest"
docker build --platform "$PLATFORM" -t "$IMAGE_NAME:latest" -f /tmp/Dockerfile.rclone /tmp
rm -f /tmp/Dockerfile.rclone

echo ""
echo "✅ Done — $IMAGE_NAME:latest"
echo "► docker compose up -d"
