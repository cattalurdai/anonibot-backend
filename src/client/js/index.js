// BOOTSTRAP VALIDATIONS

(function () {
    'use strict'

    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.querySelectorAll('.needs-validation')

    // Loop over them and prevent submission
    Array.prototype.slice.call(forms)
        .forEach(function (form) {
            form.addEventListener('submit', function (event) {
                if (!form.checkValidity()) {
                    event.preventDefault()
                    event.stopPropagation()
                }
                createPost()
                form.classList.add('was-validated')
            }, false)
        })
})()


// FORM 


function buildBody() {
    const body = {
        text: document.getElementById("textArea").value,
        background: document.querySelector('input[name="backgroundSelection"]:checked').value
    }
    return JSON.stringify(body)
}

function getPreview() {
    fetch('http://localhost:4555/getPreview', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: buildBody()
    }).then(res => {
        console.log(res)
    })
}

async function createPost() {
    fetch('http://localhost:4555/createPost', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: buildBody()
    })
}

document.getElementById("previewBtn").addEventListener("click", function () {
    getPreview()
})

// CLOSE NAVBAR WHEN CLICK

const navLinks = document.querySelectorAll('.nav-link')
const menuToggle = document.getElementById('navbarMenu')
const bsCollapse = new bootstrap.Collapse(menuToggle, { toggle: false })
navLinks.forEach((l) => {
    l.addEventListener('click', () => { bsCollapse.toggle() })
})


// IMPORT CSS 

require("../css/style.css")