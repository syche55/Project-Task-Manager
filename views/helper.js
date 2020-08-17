function validateForm() {
  var x = document.forms[".listInput"][".newItem"].value;
  if (x == "") {
    alert("Please enter an item");
    return false;
  }
}
