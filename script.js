const API_KEY = "AIzaSyB2gMpdf1dDa2hKR3j9Zoe5vgJGSrPw7rU";
const ITEMS_PER_PAGE = 10;
const MAX_RESULTS = 50;

let allResults = [];
let currentPage = 1;
let currentView = "grid";
let collectionItems = [];

$(document).ready(function () {

  // Disable view buttons at start
  $("#gridViewBtn").prop("disabled", true);
  $("#listViewBtn").prop("disabled", true);

  $("#searchBtn").on("click", performSearch);

  $("#searchInput").on("keypress", function (e) {
    if (e.which === 13) performSearch();
  });

  $("#gridViewBtn").on("click", function () {
    if (allResults.length === 0) return;

    currentView = "grid";
    $("#gridViewBtn").addClass("active-btn");
    $("#listViewBtn").removeClass("active-btn");

    $("#results").removeClass("list-mode");
    $("#collection").removeClass("list-mode");

    renderPage(currentPage);
    renderCollection();
  });

  $("#listViewBtn").on("click", function () {
    if (allResults.length === 0) return;

    currentView = "list";
    $("#listViewBtn").addClass("active-btn");
    $("#gridViewBtn").removeClass("active-btn");

    $("#results").addClass("list-mode");
    $("#collection").addClass("list-mode");

    renderPage(currentPage);
    renderCollection();
  });

  $("#showSearchBtn").on("click", function () {
    $("#resultsSection").show();
    $("#collectionSection").hide();
    $("#contentTitle").text("Search Results");

    $("#showSearchBtn").addClass("active-btn");
    $("#showCollectionBtn").removeClass("active-btn");
  });

  $("#showCollectionBtn").on("click", function () {
    $("#resultsSection").hide();
    $("#collectionSection").show();
    $("#contentTitle").text("Collection");

    $("#showCollectionBtn").addClass("active-btn");
    $("#showSearchBtn").removeClass("active-btn");
  });

  loadCollection();
});

function performSearch() {
  const keyword = $("#searchInput").val().trim();

  if (!keyword) {
    $("#searchMessage").text("Please enter a keyword first.");
    $("#results").empty();
    $("#pagination").empty();
    return;
  }

  $("#searchMessage").text("Loading search results...");
  $("#results").empty();
  $("#pagination").empty();

  $.when(
    $.getJSON("https://www.googleapis.com/books/v1/volumes", {
      q: keyword,
      maxResults: 20,
      startIndex: 0,
      key: API_KEY
    }),
    $.getJSON("https://www.googleapis.com/books/v1/volumes", {
      q: keyword,
      maxResults: 20,
      startIndex: 20,
      key: API_KEY
    }),
    $.getJSON("https://www.googleapis.com/books/v1/volumes", {
      q: keyword,
      maxResults: 20,
      startIndex: 40,
      key: API_KEY
    })
  )
    .done(function (response1, response2, response3) {

      const items1 = response1[0].items || [];
      const items2 = response2[0].items || [];
      const items3 = response3[0].items || [];

      const combined = items1.concat(items2, items3);
      const uniqueMap = new Map();

      combined.forEach(function (book) {
        if (book.id && !uniqueMap.has(book.id)) {
          uniqueMap.set(book.id, book);
        }
      });

      allResults = Array.from(uniqueMap.values()).slice(0, MAX_RESULTS);
      currentPage = 1;

      if (allResults.length === 0) {
        $("#searchMessage").text("No books found for that keyword.");
        return;
      }

      // Enable buttons AFTER search
      $("#gridViewBtn").prop("disabled", false);
      $("#listViewBtn").prop("disabled", false);

      $("#searchMessage").text(
        `Showing ${allResults.length} results. Click a book to view details.`
      );

      $("#resultsSection").show();
      $("#collectionSection").hide();

      renderPage(currentPage);
      renderPagination();
    })
    .fail(function () {
      $("#searchMessage").text("Search request failed. Please try again later.");
    });
}

function renderPage(pageNumber) {

  // STOP if no data (IMPORTANT FIX)
  if (allResults.length === 0) return;

  const start = (pageNumber - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageItems = allResults.slice(start, end);

  const formattedItems = pageItems.map(function (book) {
    const volume = book.volumeInfo || {};

    return {
      id: book.id,
      title: volume.title || "No title available",
      authors: volume.authors ? volume.authors.join(", ") : "Unknown author",
      publishedDate: volume.publishedDate || "Unknown date",
      thumbnail:
        volume.imageLinks?.thumbnail ||
        "https://via.placeholder.com/120x180?text=No+Cover"
    };
  });

  const template = $("#result-template").html();
  const html = Mustache.render(template, { items: formattedItems });
  $("#results").html(html);

  if (currentView === "list") {
    $("#results").addClass("list-mode");
  } else {
    $("#results").removeClass("list-mode");
  }

  $("#results .book-card").on("click", function () {
    const selectedId = $(this).data("id");
    const selectedBook = allResults.find(b => b.id === selectedId);
    if (selectedBook) showDetails(selectedBook);
  });
}

function renderPagination() {
  $("#pagination").empty();
  const totalPages = Math.ceil(allResults.length / ITEMS_PER_PAGE);

  for (let i = 1; i <= totalPages; i++) {
    const button = $("<button>")
      .addClass("page-btn")
      .toggleClass("active", i === currentPage)
      .text(i)
      .on("click", function () {
        currentPage = i;
        renderPage(currentPage);
        renderPagination();
      });

    $("#pagination").append(button);
  }
}

function showDetails(book) {
  const v = book.volumeInfo || {};

  const data = {
    title: v.title || "No title",
    authors: v.authors?.join(", ") || "Unknown",
    publisher: v.publisher || "Unknown",
    publishedDate: v.publishedDate || "N/A",
    language: v.language || "N/A",
    pageCount: v.pageCount || "N/A",
    description: v.description || "No description",
    thumbnail: v.imageLinks?.thumbnail || "",
    infoLink: v.infoLink || "#"
  };

  const template = $("#details-template").html();
  $("#detailsContent").html(Mustache.render(template, data));
}

function loadCollection() {
  $.getJSON("https://www.googleapis.com/books/v1/volumes", {
    q: "web development programming",
    maxResults: 12,
    key: API_KEY
  }).done(function (res) {

    collectionItems = res.items || [];
    renderCollection();
  });
}

function renderCollection() {

  const formatted = collectionItems.map(function (book) {
    const v = book.volumeInfo || {};

    return {
      id: book.id,
      title: v.title || "No title",
      authors: v.authors?.join(", ") || "Unknown",
      thumbnail:
        v.imageLinks?.thumbnail ||
        "https://via.placeholder.com/120x180?text=No+Cover"
    };
  });

  const template = $("#collection-template").html();
  $("#collection").html(Mustache.render(template, { items: formatted }));

  if (currentView === "list") {
    $("#collection").addClass("list-mode");
  } else {
    $("#collection").removeClass("list-mode");
  }

  $("#collection .book-card").on("click", function () {
    const id = $(this).data("id");
    const book = collectionItems.find(b => b.id === id);
    if (book) showDetails(book);
  });
}
