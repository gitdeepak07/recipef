document.addEventListener('DOMContentLoaded', function () {
    const imageUpload = document.getElementById('imageUpload');
    const imageUrl = document.getElementById('imageUrl');
    const fileName = document.getElementById('fileName');
    const imagePreview = document.getElementById('imagePreview');
    const previewImage = document.getElementById('previewImage');
    const recipeForm = document.getElementById('recipeForm');


    if (imageUpload) {
        imageUpload.addEventListener('change', function () {
            if (this.files && this.files[0]) {
                fileName.textContent = this.files[0].name;
                const reader = new FileReader();
                reader.onload = function (e) {
                    previewImage.src = e.target.result;
                    imagePreview.style.display = 'block';
                }
                reader.readAsDataURL(this.files[0]);
            }
        });
    }


    imageUrl.addEventListener('input', function () {
        if (this.value) {
            previewImage.src = this.value;
            imagePreview.style.display = 'block';
            fileName.textContent = 'From URL';
        } else {
            imagePreview.style.display = 'none';
            fileName.textContent = 'No file selected';
        }
    });


    recipeForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const formData = new FormData(recipeForm);
        fetch('api/addRecipe.php', {
            method: 'POST',
            body: formData
        })
            .then(res => res.text())
            .then(data => {
                alert(data);
                recipeForm.reset();
                fileName.textContent = 'No file selected';
                imagePreview.style.display = 'none';
            })
            .catch(err => alert('Error submitting recipe: ' + err));
    });
});