(() => {
	"use strict";

	const ready = callback => {
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", callback, { once: true });
		} else callback();
	};

	ready(() => {
		const body = document.body;
		const sidebar = document.querySelector("[data-sidebar], .sidebar");
		const menuButton = document.querySelector("[data-menu-toggle], .menu-toggle, #menuToggle");
		const themeButton = document.querySelector("[data-theme-toggle], .theme-toggle, #themeToggle");
		const search = document.querySelector("[data-dashboard-search], #dashboardSearch, .search-input");

		// Theme preference
		try {
			if (localStorage.getItem("dashboard-theme") === "dark") body.classList.add("dark-mode");
		} catch (_) {}
		themeButton?.addEventListener("click", () => {
			const dark = body.classList.toggle("dark-mode");
			themeButton.setAttribute("aria-pressed", String(dark));
			try { localStorage.setItem("dashboard-theme", dark ? "dark" : "light"); } catch (_) {}
		});

		// Responsive sidebar
		menuButton?.addEventListener("click", () => {
			const open = sidebar?.classList.toggle("open") ?? false;
			body.classList.toggle("sidebar-open", open);
			menuButton.setAttribute("aria-expanded", String(open));
		});
		document.querySelectorAll("[data-nav-link], .sidebar a[href^='#']").forEach(link => {
			link.addEventListener("click", () => {
				document.querySelectorAll("[data-nav-link], .sidebar a[href^='#']").forEach(item => {
					item.classList.remove("active");
					item.removeAttribute("aria-current");
				});
				link.classList.add("active");
				link.setAttribute("aria-current", "page");
				sidebar?.classList.remove("open");
				body.classList.remove("sidebar-open");
				menuButton?.setAttribute("aria-expanded", "false");
			});
		});

		// Filter dashboard cards and activity entries as the user types.
		search?.addEventListener("input", () => {
			const query = search.value.trim().toLocaleLowerCase();
			document.querySelectorAll("[data-searchable], .dashboard-card, .stat-card, .activity-item")
				.forEach(item => { item.hidden = !item.textContent.toLocaleLowerCase().includes(query); });
		});

		// Optional live date and clock widgets.
		const renderDateTime = () => {
			const now = new Date();
			const date = document.querySelector("[data-current-date], #currentDate, .current-date");
			const time = document.querySelector("[data-current-time], #currentTime, .current-time");
			if (date) date.textContent = new Intl.DateTimeFormat(undefined, {
				weekday: "long", year: "numeric", month: "long", day: "numeric"
			}).format(now);
			if (time) time.textContent = new Intl.DateTimeFormat(undefined, {
				hour: "numeric", minute: "2-digit"
			}).format(now);
		};
		renderDateTime();
		window.setInterval(renderDateTime, 60_000);

		// Dismissible alert/notification controls.
		document.querySelectorAll("[data-dismiss], .alert-close").forEach(button => {
			button.addEventListener("click", () => button.closest("[data-notice], .alert, .notification")?.remove());
		});
	});
})();
