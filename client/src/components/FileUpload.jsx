import { useRef, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";

function FileUpload({ onUploaded }) {

    const fileRef = useRef();

    const [uploading, setUploading] = useState(false);

    const upload = async (e) => {

        const file = e.target.files[0];

        if (!file) return;

        const formData = new FormData();

        formData.append("file", file);

        try {

            setUploading(true);

            const res = await axios.post(

                `${API_BASE_URL}/file`,

                formData,

                {

                    headers: {

                        "Content-Type": "multipart/form-data"

                    }

                }

            );

            onUploaded(res.data);

        }

        catch (err) {

            console.log(err);

            alert("File upload failed");

        }

        finally {

            setUploading(false);

            e.target.value = "";

        }

    };

    return (

        <>

            <button

                className="icon-btn"

                onClick={() => fileRef.current.click()}

                title="Attach File"

            >

                📎

            </button>

            <input

                ref={fileRef}

                type="file"

                onChange={upload}

                style={{ display: "none" }}

            />

            {

                uploading && (

                    <span

                        style={{

                            marginLeft: "8px",

                            fontSize: "13px",

                            color: "#666"

                        }}

                    >

                        Uploading...

                    </span>

                )

            }

        </>

    );

}

export default FileUpload;