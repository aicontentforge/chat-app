import { useState } from "react";
import {
    FiPaperclip,
    FiImage,
    FiFile,
    FiVideo,
    FiMusic
} from "react-icons/fi";

import ImageUpload from "./ImageUpload";
import FileUpload from "./FileUpload";

function AttachmentMenu({ sendImage, sendFile }) {

    const [open, setOpen] = useState(false);

    return (

        <div className="attachment-menu">

            <button
                className="icon-btn"
                onClick={() => setOpen(!open)}
                title="Attach"
            >
                <FiPaperclip />
            </button>

            {open && (

    <div className="attachment-popup">

        <div className="attachment-item">

            <div className="attachment-circle image">

                <ImageUpload
                    onUploaded={sendImage}
                />

            </div>

            <span>Image</span>

        </div>

        <div className="attachment-item">

            <div className="attachment-circle file">

                <FileUpload
                    onUploaded={sendFile}
                />

            </div>

            <span>Document</span>

        </div>

    </div>

)}

        </div>

    );

}

export default AttachmentMenu;