// profile.js

document.addEventListener('DOMContentLoaded', loadUserProfile);

async function loadUserProfile() {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        swal({
            text: "You must log in first.",
            icon: "warning",
            button: "OK"
        }).then(() => window.location.href = "login.html");
        return;
    }

    try {
        const res = await fetch("http://localhost:8080/api/auth/user", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });

        if (res.status === 401 || res.status === 403) {
            swal({
                text: "Session expired. Please log in again.",
                icon: "warning",
                button: "OK"
            }).then(() => window.location.href = "login.html");
            return;
        }

        if (!res.ok) {
            throw new Error(`Failed to load profile: ${res.status} ${res.statusText}`);
        }

        const user = await res.json();

        // Fill the fields
        document.getElementById('fname').value = user.firstName || '';
        document.getElementById('lname').value = user.lastName || '';
        document.getElementById('contactnumber').value = user.contactNumber || '';

        // Optional extra fields:
        // document.getElementById('email').value = user.email || '';
        // if (user.profilePicture) document.getElementById('profilePicturePreview').src = user.profilePicture;

    } catch (err) {
        console.error(err);
        swal({
            text: "Could not load profile. Please try again.",
            icon: "error",
            button: "OK"
        });
    }
}
