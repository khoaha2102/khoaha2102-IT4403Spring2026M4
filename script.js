const API_KEY = "AIzaSyB2gMpdf1dDa2hKR3j9Zoe5vgJGSrPw7rU";
const ITEMS_PER_PAGE = 10;
const MAX_RESULTS = 50;

let allResults = [];
let currentPage = 1;
let currentView = "grid";

$(document).ready(function () {

  $("#searchBtn").click(performSearch);

  $("#searchInput").keypress(function (e) {
    if (e.which === 13) performSearch();
  });

  // VIEW TOGGLE
  $("#gridViewBtn").click(function () {
    currentView = "grid";
    $(this).addClass("active-btn");
    $("#listViewBtn").removeClass("active-btn");
    renderPage(currentPage);
  });

  $("#listViewBtn").click(function () {
    currentView = "list";
    $(this).addClass("active-btn");
    $("#gridViewBtn").removeClass("active-btn");
    renderPage(currentPage);
  });

  // TAB SWITCH
  $("#showSearchBtn").click(function () {
    $("#resultsSection").show();
    $("#collectionSection").hide();
    $("#contentTitle").text("Search Results");
  });

  $("#showCollectionBtn").click(function () {
    $("#resultsSection").hide();
    $("#collectionSection").show();
    $("#contentTitle").text("Collection");
  });

  loadCollection();
});

function performSearch() {
  const keyword = $("#searchInput").val().trim();

  if (!keyword) {
    $("#searchMessage").text("Please enter a keyword first.");
    return;
  }

  $("#searchMessage").text("Loading search results...");

  $.when(
    $.getJSON("https://www.googleapis.com/books/v1/volumes", {
      q: keyword, maxResults: 20, startIndex: 0, key: API_KEY
    }),
    $.getJSON("https://www.googleapis.com/books/v1/volumes", {
      q: keyword, maxResults: 20, startIndex: 20, key: API_KEY
    }),
    $.getJSON("https://www.googleapis.com/books/v1/volumes", {
      q: keyword, maxResults: 20, startIndex: 40, key: API_KEY
    })
  ).done(function (r1, r2, r3) {

    const combined = [...(r1[0].items || []), ...(r2[0].items || []), ...(r3[0].items || [])];

    const unique = new Map();
    combined.forEach(b => {
      if (b.id && !unique.has(b.id)) unique.set(b.id, b);
    });

    allResults = Array.from(unique.values()).slice(0, MAX_RESULTS);
    currentPage = 1;

    if (allResults.length === 0) {
      $("#searchMessage").text("No results found.");
      return;
    }

    $("#searchMessage").text(`Showing ${allResults.length} results`);

    renderPage(currentPage);
    renderPagination();

  }).fail(function () {
    $("#searchMessage").text("Search failed.");
  });
}

function renderPage(page) {
  const start = (page - 1) * ITEMS_PER_PAGE;
  const pageItems = allResults.slice(start, start + ITEMS_PER_PAGE);

  const formatted = pageItems.map(book => {
    const v = book.volumeInfo || {};
    return {
      id: book.id,
      title: v.title || "No title",
      authors: v.authors?.join(", ") || "Unknown",
      publishedDate: v.publishedDate || "N/A",
      thumbnail: v.imageLinks?.thumbnail || "https://via.placeholder.com/120x180",
      viewClass: currentView === "list" ? "list-view" : ""
    };
  });

  const template = $("#result-template").html();
  const html = Mustache.render(template, { items: formatted });

  $("#results").html(html);

  attachClick();
}

function attachClick() {
  $(".book-card").click(function () {
    const id = $(this).data("id");

    const book = allResults.find(b => b.id === id);
    showDetails(book);
  });
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
    thumbnail: v.imageLinks?.thumbnail || ""
  };

  const template = $("#details-template").html();
  const html = Mustache.render(template, data);

  $("#detailsContent").html(html);
}

function renderPagination() {
  $("#pagination").empty();

  const totalPages = Math.ceil(allResults.length / ITEMS_PER_PAGE);

  for (let i = 1; i <= totalPages; i++) {
    const btn = $("<button>")
      .text(i)
      .addClass("page-btn")
      .toggleClass("active", i === currentPage)
      .click(function () {
        currentPage = i;
        renderPage(currentPage);
        renderPagination();
      });

    $("#pagination").append(btn);
  }
}

function loadCollection() {
  $.getJSON("https://www.googleapis.com/books/v1/volumes", {
    q: "programming web development",
    maxResults: 12,
    key: API_KEY
  }).done(function (res) {

    const formatted = (res.items || []).map(b => {
      const v = b.volumeInfo || {};
      return {
        id: b.id,
        title: v.title || "No title",
        authors: v.authors?.join(", ") || "Unknown",
        thumbnail: v.imageLinks?.thumbnail || ""
      };
    });

    const template = $("#collection-template").html();
    const html = Mustache.render(template, { items: formatted });

    $("#collection").html(html);

    $(".collection-card").click(function () {
      const id = $(this).data("id");
      const book = res.items.find(b => b.id === id);
      showDetails(book);
    });

  });
}
