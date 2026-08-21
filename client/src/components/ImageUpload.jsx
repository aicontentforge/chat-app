import { useRef, useState } from "react";
import api from "../services/api";

function ImageUpload({ onUploaded }) {

    const [uploading, setUploading] = useState(false);

    const fileRef = useRef();

    const upload = async (e) => {

    const file = e.target.files[0];

    if (!file) return;

    const formData = new FormData();

    formData.append("image", file);

    try {

        setUploading(true);

        const res = await api.post(
            "/upload",
            formData
        );

        console.log("UPLOAD RESPONSE:", res.data);

        onUploaded(res.data.imageUrl);

    } catch (err) {

        console.error(
            "UPLOAD FAILED:",
            err.response?.data || err
        );

        alert(
            err.response?.data?.message ||
            "Upload failed"
        );

    } finally {

        setUploading(false);
        e.target.value = "";

    }

};

    return (
        <>
            <button
                className="icon-btn"
                onClick={() => fileRef.current.click()}
                title="Send Image"
            >
                🖼️
            </button>

            <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={upload}
                style={{ display: "none" }}
            />

            {uploading && (
                <span
                    style={{
                        marginLeft: "8px",
                        fontSize: "13px",
                        color: "#666"
                    }}
                >
                    Uploading...
                </span>
            )}
        </>
    );

}

export default ImageUpload;