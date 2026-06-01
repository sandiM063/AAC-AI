import { BoardTileIcon, type BoardTileIconId } from "./landing-board-icons";

const NAV_ITEMS = [
  "Overview",
  "Communication",
  "Boards",
  "AI Assistant",
  "Settings",
] as const;

const BOARD_TILES: { label: string; icon: BoardTileIconId }[] = [
  { label: "Hello", icon: "hello" },
  { label: "Yes", icon: "yes" },
  { label: "No", icon: "no" },
  { label: "Help", icon: "help" },
  { label: "Water", icon: "water" },
  { label: "Thank you", icon: "thank-you" },
  { label: "More", icon: "more" },
  { label: "Stop", icon: "stop" },
];

export function LandingPreview() {
  return (
    <section id="product" className="landing-preview-section">
      <div className="landing-preview-scene">
        <div className="landing-preview-window">
          <div className="landing-preview-chrome">
            <span className="landing-preview-dot" />
            <span className="landing-preview-dot" />
            <span className="landing-preview-dot" />
            <span className="landing-preview-url">aac.app / communication</span>
          </div>

          <div className="landing-preview-body">
            <aside className="landing-preview-sidebar">
              <p className="landing-preview-sidebar-label">Workspace</p>
              <ul className="landing-preview-nav">
                {NAV_ITEMS.map((item, index) => (
                  <li
                    key={item}
                    className={`landing-preview-nav-item ${index === 1 ? "landing-preview-nav-item-active" : ""}`}
                  >
                    <span className="landing-preview-nav-icon" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="landing-preview-user">
                <span className="landing-preview-avatar" aria-hidden>
                  S
                </span>
                <div>
                  <p className="landing-preview-user-name">Sandi</p>
                  <p className="landing-preview-user-role">Teacher</p>
                </div>
              </div>
            </aside>

            <div className="landing-preview-main">
              <header className="landing-preview-main-header">
                <div>
                  <p className="landing-preview-eyebrow">Communication board</p>
                  <h2 className="landing-preview-main-title">Classroom essentials</h2>
                </div>
                <span className="landing-preview-badge">Live</span>
              </header>

              <div className="landing-preview-board">
                {BOARD_TILES.map((tile) => (
                  <button
                    key={tile.label}
                    type="button"
                    className="landing-preview-tile"
                    tabIndex={-1}
                    aria-hidden
                  >
                    <span className="landing-preview-tile-icon-wrap">
                      <BoardTileIcon id={tile.icon} className="landing-preview-tile-icon" />
                    </span>
                    <span className="landing-preview-tile-label">{tile.label}</span>
                  </button>
                ))}
              </div>

              <div className="landing-preview-output">
                <span className="landing-preview-output-label">Output</span>
                <p className="landing-preview-output-text">Hello — ready to learn today?</p>
              </div>
            </div>

            <aside className="landing-preview-panel">
              <p className="landing-preview-panel-title">AI suggestions</p>
              <ul className="landing-preview-suggestions">
                <li>Add &ldquo;Bathroom break&rdquo; to quick phrases</li>
                <li>Group tiles by morning routine</li>
                <li>Enable text-to-speech for output</li>
              </ul>
              <div className="landing-preview-chat">
                <p className="landing-preview-chat-label">Assistant</p>
                <p className="landing-preview-chat-bubble">
                  I can help you build boards tailored to your profession.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
