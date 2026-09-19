document.addEventListener('DOMContentLoaded', function () {
    const filterBox = document.getElementById('filterList');
    const toggleButton = document.getElementById('toggleFilter');

    toggleButton.onclick = function (event) {
        event.preventDefault();
        filterBox.classList.toggle('d-none');
    };

    document.addEventListener('click', function (e) {
        if (!filterBox.contains(e.target) && !toggleButton.contains(e.target)) {
            filterBox.classList.add('d-none');
        }
    });
});

document.getElementById('toggleReplies').addEventListener('click', function() {
    var replies = document.getElementById('replies');
    if (replies.style.display === 'none') {
        replies.style.display = 'block';
        this.textContent = 'Hide Replies';
    } else {
        replies.style.display = 'none';
        this.textContent = 'Show Replies';
    }
});


