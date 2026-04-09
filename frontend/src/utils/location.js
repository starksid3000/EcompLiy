export const fetchLocationFromZip = async (countryCode, zipCode) => {
    try {
        const response = await fetch(`https://api.zippopotam.us/${countryCode.toLowerCase()}/${zipCode}`);
        if (!response.ok) return null;
        const data = await response.json();
        if (data.places && data.places.length > 0) {
            return {
                city: data.places[0]["place name"],
                state: data.places[0]["state"]
            };
        }
        return null;
    } catch {
        return null;
    }
};

export const detectUserLocation = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation is not supported by your browser"));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // Use OpenStreetMap Nominatim for free reverse geocoding
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, {
                        headers: {
                            'Accept-Language': 'en-US,en;q=0.9'
                        }
                    });
                    const data = await res.json();
                    if (data && data.address) {
                        resolve({
                            street: data.address.road || "",
                            house: data.address.house_number || "",
                            city: data.address.city || data.address.town || data.address.village || data.address.suburb || data.address.municipality || data.address.county || "",
                            state: data.address.state || "",
                            zipCode: data.address.postcode || "",
                            country: data.address.country_code ? data.address.country_code.toUpperCase() : "US"
                        });
                    } else {
                        reject(new Error("Could not reverse geocode"));
                    }
                } catch (err) {
                    reject(err);
                }
            },
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    });
};
