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
      const response = await fetch(
        "https://raw.githubusercontent.com/saaslabsco/frontend-assignment/refs/heads/master/frontend-assignment.json"
      );

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
      this.hideLoading();
      console.error("Fetch error:", error);
      throw error;
    }
  }

  renderTable() {
    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    const endIndex = startIndex + this.rowsPerPage;
    const currentProjects = this.projects.slice(startIndex, endIndex);

    console.log("Current page projects:", currentProjects);

    if (currentProjects.length === 0) {
      this.tableBody.innerHTML = `
            <tr>
                <td colspan="3">No projects to display</td>
            </tr>
        `;
      return;
    }

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
    this.paginationContainer.innerHTML = "";

    // Previous button
    if (pageCount > 1) {
      this.addPaginationButton(
        "Previous",
        this.currentPage > 1 ? this.currentPage - 1 : null
      );
    }

    // Page numbers
    for (let i = 1; i <= pageCount; i++) {
      this.addPaginationButton(i, i);
    }

    // Next button
    if (pageCount > 1) {
      this.addPaginationButton(
        "Next",
        this.currentPage < pageCount ? this.currentPage + 1 : null
      );
    }
  }

  addPaginationButton(text, pageNumber) {
    const button = document.createElement("button");
    button.innerText = text;

    if (pageNumber === null) {
      button.disabled = true;
    } else {
      button.classList.toggle("active", pageNumber === this.currentPage);
      button.addEventListener("click", () => {
        this.currentPage = pageNumber;
        this.renderTable();
        this.setupPagination();
      });
    }

    this.paginationContainer.appendChild(button);
  }

  showLoading() {
    this.loadingElement.style.display = "block";
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
