import { useState } from "react";

function LocationPicker({ onLocation }) {

    const [loading, setLoading] = useState(false);

    const detectLocation = () => {

        if (!navigator.geolocation) {

            alert("Geolocation not supported");

            return;

        }

        setLoading(true);

        navigator.geolocation.getCurrentPosition(

            async (position) => {

                try {

                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;

                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    );

                    const data = await response.json();

                    onLocation({

                        latitude,
                        longitude,

                        city:
                            data.address.city ||
                            data.address.town ||
                            data.address.village ||
                            "",

                        state:
                            data.address.state || "",

                        country:
                            data.address.country || "",

                        countryCode:
                            data.address.country_code
                                ? data.address.country_code.toUpperCase()
                                : ""

                    });

                } catch (error) {

                    console.error("Location detection error:", error);

                    alert("Could not determine your location.");

                } finally {

                    setLoading(false);

                }

            },

            () => {

                setLoading(false);

                alert("Location permission denied.");

            }

        );

    };

    return (

        <button
            type="button"
            onClick={detectLocation}
        >

            {loading
                ? "Detecting..."
                : "📍 Use Current Location"}

        </button>

    );

}

export default LocationPicker;