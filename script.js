class KickstarterTable {
  constructor() {
    this.projects = [];
    this.currentPage = 1;
    this.rowsPerPage = 5;
    this.tableBody = document.getElementById("tableBody");
    this.paginationContainer = document.getElementById("pagination");
    this.loadingElement = document.getElementById("loading");
    this.errorElement = document.getElementById("error");
  }

  async init() {
    try {
      await this.fetchProjects();
      this.renderTable();
      this.setupPagination();
    } catch (error) {
      this.showError("Failed to load projects. Please try again later.");
    }
  }

  async fetchProjects() {
    try {
      this.showLoading();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(
        "https://raw.githubusercontent.com/saaslabsco/frontend-assignment/refs/heads/master/frontend-assignment.json",
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Raw data:", data);

      // Transform the data to match our needs
      this.projects = data.map((project) => ({
        percentageFunded:
          project.percentage_funded || project["percentage.funded"] || 0,
        amountPledged: project.amt_pledged || project["amt.pledged"] || 0,
      }));

      console.log("Transformed projects:", this.projects);

      if (this.projects.length === 0) {
        throw new Error("No projects data received");
      }

      this.hideLoading();
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("Request timed out. Please try again.");
      }
      this.hideLoading();
      console.error("Fetch error:", error);
      throw error;
    }
  }

  renderTable() {
    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    const endIndex = startIndex + this.rowsPerPage;
    const currentProjects = this.projects.slice(startIndex, endIndex);

    if (currentProjects.length === 0) {
      this.tableBody.innerHTML = `
            <tr>
                <td colspan="3">
                    <div class="table-body-empty">
                        No projects to display
                    </div>
                </td>
            </tr>
        `;
      return;
    }

    // Remove empty rows and just show actual data
    this.tableBody.innerHTML = currentProjects
      .map(
        (project, index) => `
                <tr>
                    <td>${startIndex + index + 1}</td>
                    <td>${Math.round(project.percentageFunded)}%</td>
                    <td>$${Math.round(
                      project.amountPledged
                    ).toLocaleString()}</td>
                </tr>
            `
      )
      .join("");
  }

  setupPagination() {
    const pageCount = Math.ceil(this.projects.length / this.rowsPerPage);
    this.paginationContainer.innerHTML = `
        <div class="table-footer">
            <div class="rows-per-page">
                <span>Rows per page:</span>
                <select class="rows-select">
                    ${[5, 10, 15, 20]
                      .map(
                        (value) => `
                            <option value="${value}" ${
                          this.rowsPerPage === value ? "selected" : ""
                        }>
                                ${value}
                            </option>
                        `
                      )
                      .join("")}
                </select>
            </div>
            <div class="pagination-controls">
                <button class="page-nav" ${
                  this.currentPage === 1 ? "disabled" : ""
                }>
                    ←
                </button>
                <div class="page-info">
                    <input type="number" class="page-input" value="${
                      this.currentPage
                    }" min="1" max="${pageCount}">
                    <span>of ${pageCount}</span>
                </div>
                <button class="page-nav" ${
                  this.currentPage === pageCount ? "disabled" : ""
                }>
                    →
                </button>
            </div>
        </div>
    `;

    // Add existing event listeners
    const prevButton = this.paginationContainer.querySelector(
      ".page-nav:first-child"
    );
    const nextButton = this.paginationContainer.querySelector(
      ".page-nav:last-child"
    );
    const pageInput = this.paginationContainer.querySelector(".page-input");
    const rowsSelect = this.paginationContainer.querySelector(".rows-select");

    // Add rows per page change handler
    rowsSelect.addEventListener("change", (e) => {
      this.rowsPerPage = parseInt(e.target.value);
      this.currentPage = 1; // Reset to first page when changing rows per page
      this.renderTable();
      this.setupPagination();
    });

    prevButton.addEventListener("click", () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.renderTable();
        this.setupPagination();
      }
    });

    nextButton.addEventListener("click", () => {
      if (this.currentPage < pageCount) {
        this.currentPage++;
        this.renderTable();
        this.setupPagination();
      }
    });

    pageInput.addEventListener("change", (e) => {
      const newPage = parseInt(e.target.value);
      if (newPage >= 1 && newPage <= pageCount) {
        this.currentPage = newPage;
        this.renderTable();
        this.setupPagination();
      } else {
        this.showError(
          `Page ${newPage} does not exist. Please enter a page number between 1 and ${pageCount}`
        );
        e.target.value = this.currentPage;
        setTimeout(() => (this.errorElement.style.display = "none"), 3000);
      }
    });

    pageInput.addEventListener("input", (e) => {
      // Remove non-numeric characters
      e.target.value = e.target.value.replace(/[^0-9]/g, "");
    });
  }

  showLoading() {
    this.loadingElement.style.display = "block";
    this.tableBody.innerHTML = `
        <tr>
            <td colspan="3">
                <div class="table-body-empty">
                    Loading data...
                </div>
            </td>
        </tr>
    `;
  }

  hideLoading() {
    this.loadingElement.style.display = "none";
  }

  showError(message) {
    this.errorElement.textContent = message;
    this.errorElement.style.display = "block";
  }
}

// Initialize the table when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const table = new KickstarterTable();
  table.init();
});
