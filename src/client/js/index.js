// BOOTSTRAP VALIDATIONS


(function () {
    'use strict'

    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.querySelectorAll('.needs-validation')

    // Loop over them and prevent submission
    Array.prototype.slice.call(forms)
        .forEach(function (form) {
            form.addEventListener('submit', function (event) {
                event.preventDefault()
                event.stopPropagation()
                const clickedButton = event.submitter;
                if (form.checkValidity()) {
                    clickedButton.id === "postSubmit" ? createPost() : getPreview()
                }
                form.classList.add('was-validated')
            }, false)
        })
})()


// IMPORT CSS 

require("../css/style.css")

// FORM 
async function buildBody() {
    const body = {
        text: await document.getElementById("textArea").value,
        background: await document.querySelector('input[name="backgroundSelection"]:checked').value
    }
    return JSON.stringify(body)
}

const previewField = document.getElementById("imagePreview")

async function getPreview() {
    try {
        const response = await fetch('http://localhost:4555/getPreview', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: await buildBody()
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            console.error(errorMessage);
            return;
        }

        const base64String = await response.text();
        previewField.src = `data:image/png;base64,${base64String}`;
    } catch (error) {
        console.error(error);
    }
}



async function createPost() {
    try {
        const response = await fetch('http://localhost:4555/createPost', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: await buildBody()
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

    } catch (error) {
        console.error('Error:', error);

    }
}





// CLOSE NAVBAR WHEN CLICK

const navLinks = document.querySelectorAll('.nav-link')
const menuToggle = document.getElementById('navbarMenu')
const bsCollapse = new bootstrap.Collapse(menuToggle, { toggle: false })
navLinks.forEach((l) => {
    l.addEventListener('click', () => { bsCollapse.toggle() })
})

