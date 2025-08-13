$(document).ready(function() {
    // Fetch pending booking count
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        swal({
            text: "Authorization failed! Please log in again.",
            icon: "warning",
            button: "OK"
        }).then(() => {
            window.location.href = "login.html";
        });
        return;
    }
    
    $.ajax({
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        },
        url: "http://localhost:8080/api/statistic",
        success: function(data) {
            $('#Count').text(data.currentOrders);
            $('#confirmCount').text(data.completeOrders);
            $('#users').text(data.totalUsers);
            $('#critical').text(data.menuItems);
        },
        error: function(xhr, status, error) {
            console.error("Failed to fetch data: " + error);
        }
    });
});
