import "../styles/wallpaper.css";

const wallpapers = [
  "/wallpapers/wall1.jpg",
  "/wallpapers/wall2.jpg",
  "/wallpapers/wall3.jpg",
  "/wallpapers/wall4.jpg",
  "/wallpapers/wall5.jpg",
  "/wallpapers/wall6.jpg",
];

function WallpaperModal({
  open,
  onClose,
  onSelect,
}) {
  if (!open) return null;

  return (
    <div className="wallpaper-overlay">

      <div className="wallpaper-modal">

        <div className="wallpaper-header">

          <h2>Choose Wallpaper</h2>

          <button onClick={onClose}>✕</button>

        </div>

        <div className="wallpaper-grid">

          {wallpapers.map((wallpaper, index) => (

            <img
              key={index}
              src={wallpaper}
              alt=""
              onClick={() => onSelect(wallpaper)}
            />

          ))}

        </div>

      </div>

    </div>
  );
}

export default WallpaperModal;