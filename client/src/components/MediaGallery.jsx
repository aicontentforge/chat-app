import { useState } from "react";
import { API_ORIGIN } from "../config";
import "../styles/mediagallery.css";

function MediaGallery({
    open,
    images,
    onClose
}) {

    const [selectedImage, setSelectedImage] = useState(null);

    if (!open) return null;

    return (

        <div className="media-overlay">

            <div className="media-modal">

                <div className="media-header">

                    <h2>Shared Media</h2>

                    <button
                        className="close-btn"
                        onClick={onClose}
                    >
                        ✕
                    </button>

                </div>

                {images.length === 0 ? (

                    <div className="media-empty">

                        No shared images.

                    </div>

                ) : (

                    <div className="media-grid">

                        {images.map((img) => (

                            <img
                                key={img.id}
                                src={`${API_ORIGIN}${img.image}`}
                                alt=""
                                className="media-image"
                                onClick={() => setSelectedImage(img)}
                            />

                        ))}

                    </div>

                )}

            </div>

            {selectedImage && (

                <div
                    className="preview-overlay"
                    onClick={() => setSelectedImage(null)}
                >

                    <div
                        className="preview-box"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <img
                            src={`${API_ORIGIN}${selectedImage.image}`}
                            alt=""
                            className="preview-image"
                        />

                        <div className="preview-info">

                            <span>

                                {selectedImage.sender}

                            </span>

                            <span>

                                {selectedImage.time}

                            </span>

                            <a
                                href={`${API_ORIGIN}${selectedImage.image}`}
                                download
                            >
                                Download
                            </a>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

}

export default MediaGallery;