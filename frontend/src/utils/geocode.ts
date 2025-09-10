import axios from "axios";

export async function geocodeAddress(address: string): Promise<[number, number]> {
    const res = await axios.get("https://nominatim.openstreetmap.org/search", {
        params: { q: address, format: "json", limit: 1 },
    });

    if (res.data.length > 0) {
        return [parseFloat(res.data[0].lat), parseFloat(res.data[0].lon)];
    } else {
        throw new Error(`Address not found: ${address}`);
    }
}
