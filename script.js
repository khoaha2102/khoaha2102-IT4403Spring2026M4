const API_KEY = "";
const ITEMS_PER_PAGE = 10;
const MAX_RESULTS = 50;

let allResults = [];
let currentPage = 1;
let currentView = "grid";
let collectionItems = [];
let activeSection = "search";

$(document).ready(function () {
  $("#gridViewBtn").prop("disabled", true);
  $("#listViewBtn").prop("disabled", true);

  $("#searchBtn").on("click", performSearch);

  $("#searchInput").on("keypress", function (e) {
    if (e.which === 13) performSearch();
  });

  $("#gridViewBtn").on("click", function () {
    if (activeSection !== "search" || allResults.length === 0) return;

    currentView = "grid";
    $("#gridViewBtn").addClass("active-btn");
    $("#listViewBtn").removeClass("active-btn");
    $("#results").removeClass("list-mode");
    renderPage(currentPage);
  });

  $("#listViewBtn").on("click", function () {
    if (activeSection !== "search" || allResults.length === 0) return;

    currentView = "list";
    $("#listViewBtn").addClass("active-btn");
    $("#gridViewBtn").removeClass("active-btn");
    $("#results").addClass("list-mode");
    renderPage(currentPage);
  });

  $("#showSearchBtn").on("click", function () {
    activeSection = "search";
    $("#resultsSection").show();
    $("#collectionSection").hide();
    $("#contentTitle").text("Search Results");
    $("#showSearchBtn").addClass("active-btn");
    $("#showCollectionBtn").removeClass("active-btn");

    if (allResults.length > 0) {
      $("#gridViewBtn").prop("disabled", false);
      $("#listViewBtn").prop("disabled", false);
    } else {
      $("#gridViewBtn").prop("disabled", true);
      $("#listViewBtn").prop("disabled", true);
    }
  });

  $("#showCollectionBtn").on("click", function () {
    activeSection = "collection";
    $("#resultsSection").hide();
    $("#collectionSection").show();
    $("#contentTitle").text("Collection");
    $("#showCollectionBtn").addClass("active-btn");
    $("#showSearchBtn").removeClass("active-btn");

    $("#gridViewBtn").prop("disabled", true);
    $("#listViewBtn").prop("disabled", true);
  });

  loadCollection();
});

function performSearch() {
  const keyword = $("#searchInput").val().trim();

  if (!keyword) {
    $("#searchMessage").text("Please enter a keyword first.");
    $("#results").empty();
    $("#pagination").empty();
    allResults = [];
    currentPage = 1;
    $("#gridViewBtn").prop("disabled", true);
    $("#listViewBtn").prop("disabled", true);
    return;
  }

  $("#searchMessage").text("Loading search results...");
  $("#results").empty();
  $("#pagination").empty();

  $.when(
    $.getJSON("https://www.googleapis.com/books/v1/volumes", {
      q: keyword,
      maxResults: 20,
      startIndex: 0
    }),
    $.getJSON("https://www.googleapis.com/books/v1/volumes", {
      q: keyword,
      maxResults: 20,
      startIndex: 20
    }),
    $.getJSON("https://www.googleapis.com/books/v1/volumes", {
      q: keyword,
      maxResults: 20,
      startIndex: 40
    })
  )
    .done(function (r1, r2, r3) {
      const combined = (r1[0].items || [])
        .concat(r2[0].items || [])
        .concat(r3[0].items || []);

      const unique = new Map();
      combined.forEach(b => {
        if (b.id && !unique.has(b.id)) unique.set(b.id, b);
      });

      allResults = Array.from(unique.values()).slice(0, MAX_RESULTS);
      currentPage = 1;
      activeSection = "search";

      if (allResults.length === 0) {
        $("#searchMessage").text("No books found.");
        $("#gridViewBtn").prop("disabled", true);
        $("#listViewBtn").prop("disabled", true);
        return;
      }

      $("#gridViewBtn").prop("disabled", false);
      $("#listViewBtn").prop("disabled", false);

      $("#searchMessage").text(
        `Showing ${allResults.length} results. Click a book to view details.`
      );

      $("#resultsSection").show();
      $("#collectionSection").hide();
      $("#contentTitle").text("Search Results");
      $("#showSearchBtn").addClass("active-btn");
      $("#showCollectionBtn").removeClass("active-btn");

      renderPage(currentPage);
      renderPagination();
    })
    .fail(function () {
      $("#searchMessage").text("Search failed. Try again.");
      $("#gridViewBtn").prop("disabled", true);
      $("#listViewBtn").prop("disabled", true);
    });
}

function renderPage(pageNumber) {
  if (allResults.length === 0) return;

  const start = (pageNumber - 1) * ITEMS_PER_PAGE;
  const pageItems = allResults.slice(start, start + ITEMS_PER_PAGE);

  const formatted = pageItems.map(b => {
    const v = b.volumeInfo || {};
    return {
      id: b.id,
      title: v.title || "No title",
      authors: v.authors?.join(", ") || "Unknown",
      publishedDate: v.publishedDate || "N/A",
      thumbnail:
        v.imageLinks?.thumbnail ||
        "https://via.placeholder.com/120x180?text=No+Cover"
    };
  });

  const html = Mustache.render($("#result-template").html(), {
    items: formatted
  });

  $("#results").html(html);
  $("#results").toggleClass("list-mode", currentView === "list");

  $("#results .book-card").on("click", function () {
    const id = $(this).data("id");
    const book = allResults.find(b => b.id === id);
    if (book) showDetails(book);
  });
}

function renderPagination() {
  $("#pagination").empty();
  const total = Math.ceil(allResults.length / ITEMS_PER_PAGE);

  for (let i = 1; i <= total; i++) {
    const btn = $("<button>")
      .addClass("page-btn")
      .toggleClass("active", i === currentPage)
      .text(i)
      .on("click", function () {
        currentPage = i;
        renderPage(currentPage);
        renderPagination();
      });

    $("#pagination").append(btn);
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
    thumbnail:
      v.imageLinks?.thumbnail ||
      "https://via.placeholder.com/160x240?text=No+Cover",
    infoLink: v.infoLink || "#"
  };

  const html = Mustache.render($("#details-template").html(), data);
  $("#detailsContent").html(html);
}

function loadCollection() {
  $("#collectionMessage").text("Loading collection...");

  $.getJSON("https://www.googleapis.com/books/v1/volumes", {
    q: "web development programming",
    maxResults: 12
  })
    .done(function (res) {
      collectionItems = res.items || [];

      if (collectionItems.length === 0) {
        $("#collectionMessage").text("No collection found.");
        return;
      }

      $("#collectionMessage").hide();
      renderCollection();
    })
    .fail(function () {
      $("#collectionMessage").text("Failed to load collection.");
    });
}

function renderCollection() {
  const formatted = collectionItems.map(b => {
    const v = b.volumeInfo || {};
    return {
      id: b.id,
      title: v.title || "No title",
      authors: v.authors?.join(", ") || "Unknown",
      thumbnail:
        v.imageLinks?.thumbnail ||
        "https://via.placeholder.com/120x180?text=No+Cover"
    };
  });

  const html = Mustache.render($("#collection-template").html(), {
    items: formatted
  });

  $("#collection").html(html);

  $("#collection .book-card").on("click", function () {
    const id = $(this).data("id");
    const book = collectionItems.find(b => b.id === id);
    if (book) showDetails(book);
  });
}
