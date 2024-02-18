document.addEventListener("DOMContentLoaded", function () {
    const API_GATEWAY_ENDPOINT_URL = "https://wkt4ub8a94.execute-api.us-east-1.amazonaws.com/Dev/presignedurl"; // presigned url endpoint
    const API_GATEWAY_ENDPOINT_DB = "https://wkt4ub8a94.execute-api.us-east-1.amazonaws.com/Dev/database"; // database endpoint
    const API_GATEWAY_ENDPOINT_UPLOAD = "https://wkt4ub8a94.execute-api.us-east-1.amazonaws.com/Dev/upload"; // upload endpoint
    const uploadForm = document.getElementById("uploadForm");
    const fileInput = document.getElementById("fileInput");
    const requestSaved = document.getElementById("requestSaved");
    const requestProfile = document.querySelector("#requestProfile tbody");
    const getRequestButton = document.getElementById("getrequest");

    uploadForm.addEventListener("submit", function (event) {
        event.preventDefault();
        requestSaved.textContent = "Request Processing...";

        const inputData = {
            userId: $('#userId').val(),
            accountId: $('#accountId').val(),
            bucketName: $('#bucketName').val(),
            fileName: $('#fileName').val(),
            email: $('#email').val()
        };

        // Request the signed URL
        requestSignedUrl(inputData, fileInput.files[0]);
    });

    function requestSignedUrl(inputData, file) {
        if (!file) {
            alert("Please select a file to upload.");
            requestSaved.textContent = ""; // Reset the message
            return;
        }

        $.ajax({
            url: `${API_GATEWAY_ENDPOINT_URL}?fileName=${inputData.fileName}&fileType=${file.type}`,
            type: 'GET',
            success: function (response) {
                const signedUrl = response.signedRequest;
                uploadFileToS3(signedUrl, file, inputData);
            },
            error: function () {
                alert("Error requesting signed URL");
                requestSaved.textContent = ""; // Reset the message
            }
        });
    }

    function uploadFileToS3(signedUrl, file, inputData) {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', signedUrl);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    submitFormData(inputData);
                } else {
                    alert('Error while uploading file.');
                    requestSaved.textContent = ""; // Reset the message
                }
            }
        };
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
    }

    function submitFormData(inputData) {
        // Your existing AJAX call for submitting form data
        $.ajax({
            url: API_GATEWAY_ENDPOINT_DB,
            type: 'POST',
            data: JSON.stringify(inputData),
            contentType: 'application/json; charset=utf-8',
            success: function () {
                requestSaved.textContent = "Success - Request Submitted!";
                uploadForm.reset();
                setTimeout(function () {
                    requestSaved.textContent = ""; // Reset the message after 5 seconds
                }, 5000);
            },
            error: function () {
                alert("Error submitting form data");
                requestSaved.textContent = ""; // Reset the message
            }
        });
    }

    getRequestButton.addEventListener("click", function () {
        $.ajax({
            url: API_GATEWAY_ENDPOINT_DB,
            type: 'GET',
            contentType: 'application/json; charset=utf-8',
            success: function (response) {
                requestProfile.innerHTML = "";

                // Parse the JSON string in the response body
                const responseData = JSON.parse(response.body);

                if (Array.isArray(responseData)) {
                    responseData.forEach(function (data) {
                        appendTableRow(data);
                    });
                } else {
                    // Handle single-object response
                    appendTableRow(responseData);
                }
            },
            error: function () {
                alert("Error");
            }
        });
    });

    function appendTableRow(data) {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${data.userId}</td>
            <td>${data.accountId}</td>
            <td>${data.bucketName}</td>
            <td>${data.fileName}</td>
            <td>${data.email}</td>
            <td>
                <select>
                    <option value="approve">Approve</option>
                    <option value="reject">Reject</option>
                </select>
            </td>
            <td><button class="submit-button">Submit</button></td>        
        `;
        requestProfile.appendChild(row);

        // Add event listener for the new submit button
        row.querySelector(".submit-button").addEventListener("click", function () {
            const select = row.querySelector("select");
            const selectedOption = select.options[select.selectedIndex].value;

            if (selectedOption === "approve") {
                // Change the dropdown action to "Completed"
                select.innerHTML = `<option value="completed">Completed</option>`;
                // Disable the submit button
                this.disabled = true;

                // Get the necessary data from the row
                const userId = row.cells[0].textContent;
                const fileName = row.cells[3].textContent;
                const bucketName = row.cells[2].textContent;

                // Change the text to "Request Approved"
                requestSaved.textContent = "Request Approved";

                // Make an AJAX request to the API Gateway endpoint
                $.ajax({
                    url: API_GATEWAY_ENDPOINT_UPLOAD, 
                    type: 'POST',
                    data: JSON.stringify({ accountId, fileName, bucketName }),
                    contentType: 'application/json; charset=utf-8',
                    success: function (response) {
                        // Handle success
                    },
                    error: function () {
                        // Handle error
                    }
                });
            }
        });
    }
});
