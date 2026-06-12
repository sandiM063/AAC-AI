import type { ThemeId } from "@/lib/themes";
import "./theme-preview.css";

type ThemePreviewMiniProps = {
  themeId: ThemeId;
  size?: "mini" | "large";
};

export function ThemePreviewMini({ themeId, size = "mini" }: ThemePreviewMiniProps) {
  return (
    <div
      className={`dashboard-theme-preview dashboard-theme-preview--${size}`}
      data-theme={themeId}
      aria-hidden
    >
      <div className="dashboard-theme-preview-chrome">
        <div className="dashboard-theme-preview-sidebar">
          <span className="dashboard-theme-preview-nav-item dashboard-theme-preview-nav-item-active" />
          <span className="dashboard-theme-preview-nav-item" />
          <span className="dashboard-theme-preview-nav-item" />
        </div>
        <div className="dashboard-theme-preview-main">
          <div className="dashboard-theme-preview-header">
            <span className="dashboard-theme-preview-title-bar" />
            <span className="dashboard-theme-preview-pill" />
          </div>
          <div className="dashboard-theme-preview-card">
            <span className="dashboard-theme-preview-line dashboard-theme-preview-line-wide" />
            <span className="dashboard-theme-preview-line" />
            <span className="dashboard-theme-preview-btn" />
          </div>
        </div>
      </div>
    </div>
  );
}
