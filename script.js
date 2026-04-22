const ITEMS_PER_PAGE = 10;
let allResults = [];
let currentPage = 1;

$(document).ready(function () {
  $("#searchBtn").click(performSearch);

  $("#searchInput").keypress(function (e) {
    if (e.which === 13) performSearch();
  });

  $("#gridViewBtn").click(() => $("#results").removeClass("list-view").addClass("grid-view"));
  $("#listViewBtn").click(() => $("#results").removeClass("grid-view").addClass("list-view"));

  loadCollection();
});

function performSearch() {
  const keyword = $("#searchInput").val().trim();
  if (!keyword) return;

  $.getJSON(`https://www.googleapis.com/books/v1/volumes?q=${keyword}&maxResults=40`, function (data) {
    allResults = data.items || [];
    currentPage = 1;
    renderPage();
  });
}

function renderPage() {
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = allResults.slice(start, start + ITEMS_PER_PAGE);

  const formatted = pageItems.map(b => ({
    id: b.id,
    title: b.volumeInfo.title || "No Title",
    thumbnail: b.volumeInfo.imageLinks?.thumbnail || "",
  }));

  const template = $("#book-template").html();
  const html = Mustache.render(template, { items: formatted });

  $("#results").html(html);

  setupClick();
  renderPagination();
}

function setupClick() {
  $(".card").click(function () {
    const id = $(this).data("id");

    $.getJSON(`https://www.googleapis.com/books/v1/volumes/${id}`, function (data) {
      const book = {
        title: data.volumeInfo.title,
        description: data.volumeInfo.description || "No description",
        authors: data.volumeInfo.authors?.join(", ") || "N/A",
        language: data.volumeInfo.language || "N/A",
        thumbnail: data.volumeInfo.imageLinks?.thumbnail || ""
      };

      const template = $("#details-template").html();
      const html = Mustache.render(template, book);

      $("#details").html(html);
    });
  });
}

function renderPagination() {
  let html = `
    <button ${currentPage === 1 ? "disabled" : ""} onclick="prevPage()">Prev</button>
    Page ${currentPage}
    <button ${(currentPage * ITEMS_PER_PAGE >= allResults.length) ? "disabled" : ""} onclick="nextPage()">Next</button>
  `;

  $("#pagination").html(html);
}

function nextPage() {
  currentPage++;
  renderPage();
}

function prevPage() {
  currentPage--;
  renderPage();
}

function loadCollection() {
  $.getJSON("https://www.googleapis.com/books/v1/volumes?q=popular&maxResults=10", function (data) {

    const formatted = data.items.map(b => ({
      title: b.volumeInfo.title,
      thumbnail: b.volumeInfo.imageLinks?.thumbnail || ""
    }));

    const template = $("#collection-template").html();
    const html = Mustache.render(template, { items: formatted });

    $("#collection").html(html);
  });
}
