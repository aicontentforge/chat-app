import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { API_ORIGIN } from "../config";
import ImageUpload from "../components/ImageUpload";
import DonorBadge from "../components/DonorBadge";
import "../styles/profile.css";
import LocationPicker from "../components/LocationPicker";


function Profile() {

    const params = useParams();

    const currentUser = JSON.parse(localStorage.getItem("user"));

    const username = params.username || currentUser.username;

    const navigate = useNavigate();

    const [profile, setProfile] = useState({
    displayName: "",
    bio: "",
    avatar: "",

    age: "",

    gender: "",

    latitude: "",
    longitude: "",

    city: "",
    state: "",
    country: "",
    countryCode: "",

    categories: [],

    // Whether other people can find this account via search /
    // "New Chat". This is the ONLY screen in the app where it can
    // be viewed or changed after initial signup, so it defaults to
    // true and is overwritten as soon as the real value loads below.
    discoverable: true
});

    useEffect(() => {

        api.get(`/users/profile/${username}`)
            .then(res => {

                setProfile(res.data);

            });

    }, []);

    const save = async () => {

        await api.put("/users/profile", {

    username: currentUser.username,

    displayName: profile.displayName,

    bio: profile.bio,

    avatar: profile.avatar,

    latitude: profile.latitude,

    longitude: profile.longitude,

    city: profile.city,

    state: profile.state,

    country: profile.country,

    countryCode: profile.countryCode,

    gender: profile.gender,

    age: profile.age,

    categories: profile.categories,

    discoverable: profile.discoverable

});

localStorage.setItem(
    "user",
    JSON.stringify({
        ...currentUser,
        displayName: profile.displayName,
        avatar: profile.avatar
    })
);

navigate("/chat");

    };

    const ALL_CATEGORIES = [
    "Men",
    "Women",
    "Friends",
    "Dating",
    "Business",
    "Knowledge",
    "Gaming",
    "Technology",
    "Programming",
    "Movies",
    "Music",
    "Travel",
    "Fitness",
    "Sports",
    "Anime",
    "Food",
    "Photography",
    "Startups",
    "Art",
    "Pets"
];

const toggleCategory = (category) => {

    const exists = profile.categories.includes(category);

    if (exists) {

        setProfile({
            ...profile,
            categories: profile.categories.filter(c => c !== category)
        });

    } else {

        setProfile({
            ...profile,
            categories: [...profile.categories, category]
        });

    }

};

    return (

<div className="profile-page">

    <div className="profile-card">

        <img

            src={
                profile.avatar
                    ? `${API_ORIGIN}${profile.avatar}`
                    : "https://api.dicebear.com/9.x/initials/svg?seed=User"
            }

            className="profile-avatar"

            alt=""
        />

        <ImageUpload

            onUploaded={(imageUrl)=>{

                setProfile({

                    ...profile,

                    avatar:imageUrl

                });

            }}

        />

        <h2>
            {profile.displayName || currentUser.username}
            <DonorBadge username={username} />
        </h2>

        <p className="profile-username">
            @{currentUser.username}
        </p>

        <input

            className="profile-input"

            placeholder="Display Name"

            value={profile.displayName || ""}

            onChange={(e)=>

                setProfile({

                    ...profile,

                    displayName:e.target.value

                })

            }

        />

        <input

            type="number"

            className="profile-input"

            placeholder="Age"

            value={profile.age || ""}

            onChange={(e)=>

                setProfile({

                    ...profile,

                    age: e.target.value

                })

            }

        />

        <select

            className="profile-input"

            value={profile.gender || ""}

            onChange={(e)=>

                setProfile({

                    ...profile,

                    gender: e.target.value

                })

            }

        >

            <option value="">Select Gender</option>

            <option>Male</option>

            <option>Female</option>

            <option>Other</option>

        </select>

        <textarea

            className="profile-textarea"

            rows={5}

            placeholder="Tell everyone about yourself..."

            value={profile.bio || ""}

            onChange={(e)=>

                setProfile({

                    ...profile,

                    bio:e.target.value

                })

            }

        />

        <div className="profile-toggle-row">

            <div>
                <strong>🔍 Discoverable</strong>
                <p className="profile-toggle-hint">
                    Lets people find your username and Chat ID in
                    Discover and New Chat search. Turn this on if
                    someone can't find you to start a chat.
                </p>
            </div>

            <label className="profile-toggle-switch">

                <input
                    type="checkbox"
                    checked={!!profile.discoverable}
                    onChange={(e)=>

                        setProfile({

                            ...profile,

                            discoverable: e.target.checked

                        })

                    }
                />

                <span className="profile-toggle-slider" />

            </label>

        </div>

        <LocationPicker
    onLocation={(location)=>{

        setProfile({

            ...profile,

            ...location

        });

    }}
/>

        <h3 style={{ marginTop: 30 }}>
            Interests
        </h3>

        <div className="category-grid">

            {ALL_CATEGORIES.map(category => (

                <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className={
                        profile.categories.includes(category)
                            ? "category active"
                            : "category"
                    }
                >
                    {category}
                </button>

            ))}

        </div>

        {profile.city && (

    <div
        style={{
            marginTop: 20,
            marginBottom: 20,
            padding: 12,
            background: "#f3f4f6",
            borderRadius: 10
        }}
    >

        📍 {profile.city}, {profile.state}, {profile.country}

    </div>

)}

        <button

            className="profile-save"

            onClick={save}

        >

            Save Changes

        </button>

    </div>

</div>

);

}

export default Profile;