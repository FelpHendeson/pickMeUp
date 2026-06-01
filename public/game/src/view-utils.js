(function (global) {
  "use strict";

  const Echoes = (global.Echoes = global.Echoes || {});

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("pt-BR").format(value);
  }

  Echoes.escapeHtml = escapeHtml;
  Echoes.formatNumber = formatNumber;
})(window);
