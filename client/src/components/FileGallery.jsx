import { useState } from "react";
import {
    FaFilePdf,
    FaFileWord,
    FaFileExcel,
    FaFileArchive,
    FaFileAlt,
    FaDownload,
    FaSearch
} from "react-icons/fa";
import { API_ORIGIN } from "../config";
import "../styles/filegallery.css";

function FileGallery({

    open,

    files,

    onClose

}) {

    const [search, setSearch] = useState("");

    if (!open) return null;

    const filtered = files.filter(file =>
        file.fileName
            ?.toLowerCase()
            .includes(search.toLowerCase())
    );

    const getIcon = (name = "") => {

        const ext = name.split(".").pop().toLowerCase();

        if (ext === "pdf") return <FaFilePdf color="#ef4444" />;

        if (["doc", "docx"].includes(ext))
            return <FaFileWord color="#2563eb" />;

        if (["xls", "xlsx"].includes(ext))
            return <FaFileExcel color="#16a34a" />;

        if (["zip", "rar"].includes(ext))
            return <FaFileArchive color="#f59e0b" />;

        return <FaFileAlt color="#64748b"> </FaFileAlt>;

    };

    return (

        <div className="files-overlay">

            <div className="files-modal">

                <div className="files-header">

                    <h2>Shared Files</h2>

                    <button onClick={onClose}>
                        ✕
                    </button>

                </div>

                <div className="files-search">

                    <FaSearch />

                    <input
                        placeholder="Search files..."
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                    />

                </div>

                <div className="files-list">

                    {filtered.map(file => (

                        <div
                            className="file-item"
                            key={file.id}
                        >

                            <div className="file-icon">

                                {getIcon(file.fileName)}

                            </div>

                            <div className="file-info">

                                <h4>

                                    {file.fileName}

                                </h4>

                                <span>

                                    {file.sender}

                                    •

                                    {file.time}

                                </span>

                            </div>

                            <a

                                href={`${API_ORIGIN}${file.file}`}

                                target="_blank"

                                rel="noreferrer"

                            >

                                <FaDownload />

                            </a>

                        </div>

                    ))}

                </div>

            </div>

        </div>

    );

}

export default FileGallery;