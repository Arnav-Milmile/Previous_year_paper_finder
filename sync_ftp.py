from app.sync.ftp_sync import sync_ftp_index


def main() -> None:
    try:
        count = sync_ftp_index(verbose=True)
    except OSError as exc:
        raise SystemExit(f"FTP sync failed: {exc}") from exc
    except RuntimeError as exc:
        raise SystemExit(f"FTP sync failed: {exc}") from exc
    print(f"Indexed {count} PDF file(s).")


if __name__ == "__main__":
    main()
