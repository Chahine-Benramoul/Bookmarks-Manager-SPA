//<span class="cmdIcon fa-solid fa-ellipsis-vertical"></span>
let contentScrollPosition = 0;
Init_UI();

function Init_UI() {
    renderBookmarks();
    // Charger la liste de categories des bookmarks
    renderCategories();
    $('#createBookmark').on("click", async function () {
        saveContentScrollPosition();
        rendercreateBookmarkForm();
    });
    $('#abort').on("click", async function () {
        renderBookmarks();
    });
    $('#aboutCmd').on("click", function () {
        renderAbout();
    });
}

async function renderCategories(){
    let categoriesNames = await Bookmarks_API.GetCategories();
    let checkedCategories = {allCategories:"false"};
    categoriesNames.forEach((categoryName) => checkedCategories[categoryName] = false)
    
    eraseContentCategories();
    
    if(categoriesNames !== null){
        
        $(`#allCategories`).on("click", function (e) {
            checkedCategories = unCheckAllCategories(checkedCategories);
            checkedCategories = checkSelectedCategory(checkedCategories,"allCategories"); 
            eraseContent();
            $("#content").append(renderBookmarks());
        });

        categoriesNames.forEach(CategoryName => {
            $("#categories").append(renderCategory(CategoryName));
            
            $(`div#${CategoryName}`).on("click", async function (e) {
 
                checkedCategories = unCheckAllCategories(checkedCategories);
                
                checkedCategories = checkSelectedCategory(checkSelectedCategory,CategoryName);
                // Categories par filtre
                eraseContent();
                $("#content").append(renderBookmarks(CategoryName));
            })
        })
    }
}

function unCheckAllCategories(checkedCategories){
    Object.keys(checkedCategories).forEach((category)=>{
        checkedCategories[category] = false
        $(`div#${category}> i`).removeClass("fa-check");
    });
    return checkedCategories;
}

function checkSelectedCategory(checkedCategories,CategoryName){
    checkedCategories[CategoryName] = !checkedCategories[CategoryName];
    if(checkedCategories[CategoryName]){
        $(`div#${CategoryName}> i`).addClass("fa-check");
    }else{
        $(`div#${CategoryName}> i`).removeClass("fa-check");
    }
    return checkedCategories;
}

function renderCategory(name, checked = false){
    return(`
        <div class="dropdown-item menuItemLayout category" id="${name}" $>
            <i class="menuIcon fa fa-fw mx-2 ${checked ? 'fa=checked' : ''}"></i> ${name}
        </div>
    `)
}

function renderAbout() {
    saveContentScrollPosition();
    eraseContent();
    $("#createBookmark").hide();
    $("#abort").show();
    $("#actionTitle").text("À propos...");
    $("#content").append(
        $(`
            <div class="aboutContainer">
                <h2>Gestionnaire de favoris</h2>
                <hr>
                <p>
                    Application de gestion de favoris
                </p>
                <p>
                    Auteur: Chahine Benramoul
                    Code de départ: Nicolas Chourot
                </p>
                <p>
                    Collège Lionel-Groulx, automne 2023
                </p>
            </div>
        `))
}

async function renderBookmarks(category = null) {
    showWaitingGif();
    $("#actionTitle").text("Liste des favoris");
    $("#createBookmark").show();
    $("#abort").hide();
    let bookmarks = category == null ? await Bookmarks_API.Get() : await Bookmarks_API.GetCategories(category);
    eraseContent();
    if (bookmarks !== null) {
        bookmarks.forEach(bookmark => {
            $("#content").append(renderBookmark(bookmark));
        });
        restoreContentScrollPosition();
        // Attached click events on command icons
        $(".editCmd").on("click", function () {
            saveContentScrollPosition();
            renderEditBookmarkForm(parseInt($(this).attr("editBookmarkId")));
        });
        $(".deleteCmd").on("click", function () {
            saveContentScrollPosition();
            renderDeleteBookmarkForm(parseInt($(this).attr("deleteBookmarkId")));
        });
        //$(".bookmarkRow").on("click", function (e) { e.preventDefault(); })
    } else {
        renderError("Service introuvable");
    }
}

function showWaitingGif() {
    $("#content").empty();
    $("#content").append($("<div class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>'"));
}

function eraseContent() {
    $("#content").empty();
}
function eraseContentCategories() {
    $("#categories").empty();
}
function saveContentScrollPosition() {
    contentScrollPosition = $("#content")[0].scrollTop;
}

function restoreContentScrollPosition() {
    $("#content")[0].scrollTop = contentScrollPosition;
}

function renderError(message) {
    eraseContent();
    $("#content").append(
        $(`
            <div class="errorContainer">
                ${message}
            </div>
        `)
    );
}

function rendercreateBookmarkForm() {
    renderBookmarkForm();
}

async function renderEditBookmarkForm(id) {
    showWaitingGif();
    let bookmark = await Bookmarks_API.Get(id);
    if (bookmark !== null)
        renderBookmarkForm(bookmark);
    else
        renderError("Contact introuvable!");
}

async function renderDeleteBookmarkForm(id) {
    showWaitingGif();
    $("#createBookmark").hide();
    $("#abort").show();
    $("#actionTitle").text("Retrait");
    let bookmark = await Bookmarks_API.Get(id);
    eraseContent();
    if (bookmark !== null) {
        $("#content").append(`
        <div class="bookmarkdeleteForm">
            <h4>Effacer le favori suivant?</h4>
            <br>
            <div class="bookmarkRow" bookmark_id=${bookmark.Id}">
                <div class="bookmarkContainer">
                    <div class="bookmarkLayout">
                        <span class="bookmarkTitle"><img class="favicon" src="https://s2.googleusercontent.com/s2/favicons?domain=${bookmark.Url}" height="25" width="25">${bookmark.Title}</span>
                        <span class="bookmarkCategory"><a href=${bookmark.Url} target=_blank>${bookmark.Category}</a></span>
                    </div>
                </div>  
            </div>   
            <br>
            <input type="button" value="Effacer" id="deleteBookmark" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </div>    
        `);
        $('#deleteBookmark').on("click", async function () {
            showWaitingGif();
            let result = await Bookmarks_API.Delete(bookmark.Id);
            if (result){
                renderBookmarks();
                renderCategories();
            }
            else
                renderError("Une erreur est survenue!");
        });
        $('#cancel').on("click", function () {
            renderBookmarks();
        });
    } else {
        renderError("Favoris introuvable!");
    }
}

function newBookmark() {
    bookmark = {};
    bookmark.Id = 0;
    bookmark.Title = "";
    bookmark.Url = "";
    bookmark.Category = "";
    return bookmark;
}

function renderBookmarkForm(bookmark = null) {
    $("#createBookmark").hide();
    $("#abort").show();
    eraseContent();
    let create = bookmark == null;
    if (create) bookmark = newBookmark();
    $("#actionTitle").text(create ? "Création" : "Modification");
    $("#content").append(`
        <form class="form" id="bookmarkForm">
            <input type="hidden" name="Id" value="${bookmark.Id}"/>
            <br>
            <label for="Title" class="form-label">Titre </label>
            <input 
                class="form-control Alpha"
                name="Title" 
                id="Title" 
                placeholder="Nom"
                required
                RequireMessage="Veuillez entrer un titre"
                InvalidMessage="Le titre comporte un caractère illégal" 
                value="${bookmark.Title}"
            />
            <label for="Url" class="form-label">Url </label>
            <input
                class="form-control URL"
                name="Url"
                id="Url"
                placeholder="Url"
                required
                RequireMessage="Veuillez entrer votre url" 
                InvalidMessage="Veuillez entrer un url valide"
                value="${bookmark.Url}" 
            />
            <label for="Category" class="form-label">Catégorie </label>
            <input 
                class="form-control Category"
                name="Category"
                id="Category"
                placeholder="Catégorie"
                required
                RequireMessage="Veuillez entrer votre catégorie" 
                InvalidMessage="Veuillez entrer une catégorie valide"
                value="${bookmark.Category}"
            />
            <hr>
            <input type="submit" value="Enregistrer" id="saveBookmark" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </form>
    `);
    $('#Url').on("change", function (e) {
        $(" #bookmarkForm > img").remove();
        $("[name='Id']").after(`
            <img class="favicon" src="https://s2.googleusercontent.com/s2/favicons?domain=${e.target.value}" height="50" width="50">
        `);
    initFormValidation();
    });
    $('#bookmarkForm').on("submit", async function (event) {
        event.preventDefault();
        let bookmark = getFormData($("#bookmarkForm"));
        bookmark.Id = parseInt(bookmark.Id);
        showWaitingGif();
        let result = await Bookmarks_API.Save(bookmark, create);
        if (result){
            renderBookmarks();
            renderCategories();
        }
        else
            renderError("Une erreur est survenue!");
    });
    $('#cancel').on("click", function () {
        renderBookmarks();
    });
}

function getFormData($form) {
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    var jsonObject = {};
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}

function renderBookmark(bookmark) {
    return $(`
     <div class="bookmarkRow" bookmark_id=${bookmark.Id}">
        <div class="bookmarkContainer noselect">
            <div class="bookmarkLayout">                
                <span class="bookmarkTitle"><img class="favicon" src="https://s2.googleusercontent.com/s2/favicons?domain=${bookmark.Url}" height="25" width="25">${bookmark.Title}</span>
                <span class="bookmarkCategory"><a href=${bookmark.Url} target=_blank>${bookmark.Category}</a></span>
            </div>
            <div class="bookmarkCommandPanel">
                <span class="editCmd cmdIcon fa fa-pencil" editBookmarkId="${bookmark.Id}" title="Modifier ${bookmark.Title}"></span>
                <span class="deleteCmd cmdIcon fa fa-trash" deleteBookmarkId="${bookmark.Id}" title="Effacer ${bookmark.Title}"></span>
            </div>
        </div>
    </div>           
    `);
}