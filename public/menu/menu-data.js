(function () {
  var file = location.hostname.indexOf("resort.") === 0 ? "menu-resort.js" : "menu-village.js";
  document.write('<script src="/menu/' + file + '"><\/script>');
})();
