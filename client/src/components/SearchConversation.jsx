
import { useState } from "react";
import { FaSearch } from "react-icons/fa";
import "../styles/searchconversation.css";

function SearchConversation({

    open,

    messages,

    onSearch,

    onClose

}) {

    const [keyword, setKeyword] = useState("");

    if (!open) return null;

    return (

        <div className="voice-overlay">

            <div className="voice-modal">

                <div className="voice-header">

                    <h2>Search Conversation</h2>

                    <button onClick={onClose}>

                        ✕

                    </button>

                </div>

                <div className="voice-search">

                    <FaSearch />

                    <input

                        placeholder="Search..."

                        value={keyword}

                        onChange={(e) => {

                            setKeyword(e.target.value);

                            onSearch(e.target.value);

                        }}

                    />

                </div>

                <div className="voice-list">

                    {

                        messages.length === 0

                        ?

                        <div className="voice-empty">

                            No messages found

                        </div>

                        :

                        messages.map(msg => (

                            <div

                                key={msg.id}

                                className="voice-item"

                            >

                                <div className="voice-info">

                                    <h4>

                                        {msg.sender}

                                    </h4>

                                    <p>

                                        {msg.message}

                                    </p>

                                    <span>

                                        {msg.time}

                                    </span>

                                </div>

                            </div>

                        ))

                    }

                </div>

            </div>

        </div>

    );

}

export default SearchConversation;