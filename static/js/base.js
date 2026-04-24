console.log("BASE JS LOADED");
// ===================== ERROR HANDLER =====================
function handleValidationErrors(errorData) {
    console.log("Validation Error:", errorData);

    const titleError = document.getElementById("titleError");
    const descError = document.getElementById("descriptionError");

    const titleInput = document.getElementById("title");
    const descInput = document.getElementById("description");

    if (titleError) titleError.innerText = "";
    if (descError) descError.innerText = "";

    if (titleInput) titleInput.classList.remove("input-error");
    if (descInput) descInput.classList.remove("input-error");

    if (errorData.detail && Array.isArray(errorData.detail)) {
        errorData.detail.forEach(err => {
            const field = err.loc[1];
            const msg = err.msg;

            if (field === "title" && titleError) {
                titleError.innerText = msg;
                titleInput.classList.add("input-error");
            }

            if (field === "description" && descError) {
                descError.innerText = msg;
                descInput.classList.add("input-error");
            }
        });
    } else {
        alert(errorData.detail || "Something went wrong");
    }
}


// ===================== ADD TODO =====================
const todoForm = document.getElementById('todoForm');

if (todoForm) {
    todoForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const formData = new FormData(todoForm);
        const data = Object.fromEntries(formData.entries());

        // FRONTEND VALIDATION
        let isValid = true;

        document.getElementById("titleError").innerText = "";
        document.getElementById("descriptionError").innerText = "";

        if (data.title.length < 3) {
            document.getElementById("titleError").innerText = "Title must be at least 3 characters";
            isValid = false;
        }

        if (data.description.length < 3) {
            document.getElementById("descriptionError").innerText = "Description must be at least 3 characters";
            isValid = false;
        }

        if (!isValid) return;

        const payload = {
            title: data.title,
            description: data.description,
            priority: parseInt(data.priority),
            complete: false
        };

        try {
            const response = await fetch('/todos/todo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getCookie('access_token')}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                todoForm.reset();
                window.location.href = '/todos/todo-page';
            } else {
                const errorData = await response.json();
                handleValidationErrors(errorData);
            }

        } catch (error) {
            console.error(error);
            alert("Request failed");
        }
    });
}


// ===================== EDIT TODO =====================
const editTodoForm = document.getElementById('editTodoForm');

if (editTodoForm) {
    editTodoForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const formData = new FormData(editTodoForm);
        const data = Object.fromEntries(formData.entries());

        const todoId = window.location.pathname.split('/').pop();

        const payload = {
            title: data.title,
            description: data.description,
            priority: parseInt(data.priority),
            complete: data.complete === "on"
        };

        try {
            const response = await fetch(`/todos/todo/${todoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getCookie('access_token')}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                window.location.href = '/todos/todo-page';
            } else {
                const errorData = await response.json();
                handleValidationErrors(errorData);
            }

        } catch (error) {
            console.error(error);
            alert("Update failed");
        }
    });

    // DELETE TODO
    document.getElementById('deleteButton')?.addEventListener('click', async function () {
        const todoId = window.location.pathname.split('/').pop();

        try {
            const response = await fetch(`/todos/todo/${todoId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${getCookie('access_token')}`
                }
            });

            if (response.ok) {
                window.location.href = '/todos/todo-page';
            } else {
                const errorData = await response.json();
                handleValidationErrors(errorData);
            }

        } catch (error) {
            console.error(error);
            alert("Delete failed");
        }
    });
}


// ===================== LOGIN =====================
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const formData = new FormData(loginForm);
        const payload = new URLSearchParams(formData);

        try {
            const response = await fetch('/auth/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: payload.toString()
            });

            if (response.ok) {
                const data = await response.json();

                logout(false);
                document.cookie = `access_token=${data.access_token}; path=/`;

                window.location.href = '/todos/todo-page';
            } else {
                const errorData = await response.json();
                alert(errorData.detail || "Login failed");
            }

        } catch (error) {
            console.error(error);
            alert("Login request failed");
        }
    });
}


// ===================== REGISTER =====================
const registerForm = document.getElementById('registerForm');

if (registerForm) {
    registerForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const data = Object.fromEntries(new FormData(registerForm).entries());

        if (data.password !== data.password2) {
            alert("Passwords do not match");
            return;
        }

        try {
            const response = await fetch('/auth', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    email: data.email,
                    username: data.username,
                    first_name: data.firstname,
                    last_name: data.lastname,
                    role: data.role,
                    phone_number: data.phone_number,
                    password: data.password
                })
            });

            if (response.ok) {
                window.location.href = '/auth/login-page';
            } else {
                const errorData = await response.json();
                alert(errorData.detail || "Registration failed");
            }

        } catch (error) {
            console.error(error);
            alert("Registration error");
        }
    });
}


// ===================== COOKIE =====================
function getCookie(name) {
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith(name + '=')) {
            return decodeURIComponent(cookie.substring(name.length + 1));
        }
    }
    return null;
}


// ===================== LOGOUT =====================
function logout(redirect = true) {
    document.cookie.split(";").forEach(c => {
        document.cookie = c.split("=")[0] + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });

    if (redirect) {
        window.location.href = '/auth/login-page';
    }
}
