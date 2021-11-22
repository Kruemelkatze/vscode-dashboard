function initFiltering() {
    const filteringClass = 'filtering-active';
    const filteredClass = 'filtered';

    var filteringActive = false;
    var searchValue = '';

    const filterInput = document.getElementById("filter");
    filterInput.onchange = onChangeFilter;
    filterInput.onkeyup = onChangeFilter;
    filterInput.onreset = onChangeFilter;

    window.onkeydown = function (e) {
        // ctrl + f
        if (e.keyCode == 70 && e.ctrlKey) {
            toggleFiltering();
        }
    }

    function toggleFiltering() {
        filteringActive = !filteringActive;

        if (filteringActive) {
            document.body.classList.add(filteringClass);
        } else {
            document.body.classList.remove(filteringClass);
        }

        filterInput.value = '';
        onChangeFilter();
    }

    function onChangeFilter(e) {
        searchValue = filterInput.value.toLowerCase();
        console.log(searchValue);

        var matchFunc;
        try {
            if (searchValue === '*') {
                searchValue = '.+';
            }

            let regexSearch = globToRegexSimple(searchValue);
            matchFunc = (v) => !searchValue.length || regexSearch.test(v);
        } catch (error) {
            matchFunc = (v) => !searchValue.length || v && v.contains(searchValue);
        }

        let projects = [...document.querySelectorAll(".project[data-id]")];
        for (let p of projects) {
            let name = p.getAttribute("data-name") || '';
            let matches = matchFunc(name);

            if (matches) {
                p.parentNode.classList.remove(filteredClass);
            } else {
                p.parentNode.classList.add(filteredClass);
            }
        }

        let groups = document.querySelectorAll(".group[data-group-id]");
        for (let g of groups) {
            let groupProjects = [...g.querySelectorAll(".project[data-id]")].map(p => p.parentNode);
            let noneMatches = groupProjects.every(p => p.classList.contains(filteredClass));
            if (noneMatches) {
                g.classList.add(filteredClass);
            } else {
                g.classList.remove(filteredClass);
            }
        }
    }

    function globToRegexSimple(globLike) {
        try {
            let rx = globLike
                .replaceAll('\.', '\\.')
                .replaceAll('*', '.*')
                .replaceAll('?', '.');
            return new RegExp(rx)
        } catch (e) {
            return new RegExp(globLike);
        }
    }
}