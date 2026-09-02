import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/profileSetup.css";

function ProfileSetup() {

    const navigate = useNavigate();

    const currentUser = JSON.parse(localStorage.getItem("user"));

    const [gender, setGender] = useState("");

    const [country, setCountry] = useState("");

    const [city, setCity] = useState("");

    const [discoverable, setDiscoverable] = useState(true);

    const [categories, setCategories] = useState([]);

    const allCategories = [

        "Men",
        "Women",
        "Friends",
        "Dating",
        "Business",
        "Knowledge",
        "Gaming",
        "Study",
        "Travel",
        "Networking"

    ];

    const toggleCategory = (category) => {

        if (categories.includes(category)) {

            setCategories(

                categories.filter(c => c !== category)

            );

        } else {

            setCategories([

                ...categories,

                category

            ]);

        }

    };

    const saveProfile = async () => {

        await api.put("/users/profile", {

            username: currentUser.username,

            displayName: currentUser.displayName,

            avatar: currentUser.avatar,

            bio: "",

            gender,

            country,

            city,

            discoverable,

            categories

        });

        navigate("/chat");

    };

    return (

        <div className="setup-page">

            <div className="setup-card">

                <h1>Complete Your Profile</h1>

                <p>Your Chat ID</p>

                <h2>{currentUser.uniqueId}</h2>

                <hr/>

                <h3>Gender</h3>

                <select

                    value={gender}

                    onChange={(e)=>setGender(e.target.value)}

                >

                    <option value="">Select</option>

                    <option>Male</option>

                    <option>Female</option>

                    <option>Other</option>

                </select>

                <h3>Country</h3>

                <input

                    value={country}

                    onChange={(e)=>setCountry(e.target.value)}

                    placeholder="Country"

                />

                <h3>City</h3>

                <input

                    value={city}

                    onChange={(e)=>setCity(e.target.value)}

                    placeholder="City"

                />

                <h3>Categories</h3>

                <div className="category-grid">

                    {

                        allCategories.map(cat=>(

                            <button

                                key={cat}

                                type="button"

                                className={

                                    categories.includes(cat)

                                    ? "selected"

                                    : ""

                                }

                                onClick={()=>toggleCategory(cat)}

                            >

                                {cat}

                            </button>

                        ))

                    }

                </div>

                <br/>

                <label>

                    <input

                        type="checkbox"

                        checked={discoverable}

                        onChange={(e)=>

                            setDiscoverable(

                                e.target.checked

                            )

                        }

                    />

                    Discoverable

                </label>

                <br/><br/>

                <button

                    className="continue-btn"

                    onClick={saveProfile}

                >

                    Continue

                </button>

            </div>

        </div>

    );

}

export default ProfileSetup;