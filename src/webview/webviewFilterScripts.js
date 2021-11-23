function initFiltering() {
    const filteringClass = 'filtering-active';
    const filteredClass = 'filtered';
    const storageKey = 'filterValue';
    const noInitialTransitionClass = 'no-initial-transition';

    var filteringActive = false;
    var prevFilterValue = null;

    const filterInput = document.getElementById('filter');
    filterInput.onchange = onChangeFilter;
    filterInput.onkeyup = onChangeFilter;
    filterInput.onreset = onChangeFilter;
    filterInput.onblur = onChangeFilter;

    window.onkeydown = function (e) {
        // ctrl + f
        if (e.keyCode == 70 && e.ctrlKey) {
            filterInput.value = '';
            toggleFiltering();
        } else if (filteringActive && e.keyCode == 27) {
            filterInput.value = '';
            toggleFiltering(false);
        }
    }

    let storedFilter = sessionStorage.getItem(storageKey);
    if (storedFilter) {
        requestAnimationFrame(() => {
            filterInput.value = storedFilter;
            toggleFiltering(true);
            document.body.classList.add(noInitialTransitionClass);
        });
    }

    function toggleFiltering(val) {
        document.body.classList.remove(noInitialTransitionClass);

        filteringActive = val !== undefined ? val : !filteringActive;

        if (filteringActive) {
            document.body.classList.add(filteringClass);
            filterInput.focus();
        } else {
            document.body.classList.remove(filteringClass);
        }

        onChangeFilter();
    }

    function onChangeFilter(e) {
        let filterValue = filterInput.value.toLowerCase();

        if (filterValue === prevFilterValue) {
            return;
        }

        prevFilterValue = filterValue;

        sessionStorage.setItem(storageKey, filterValue);

        var matchFunc;
        try {
            if (filterValue === '*') {
                filterValue = '.+';
            }

            let regexSearch = globToRegexSimple(filterValue);
            matchFunc = (v) => !filterValue.length || regexSearch.test(v);
        } catch (error) {
            matchFunc = (v) => !filterValue.length || v && v.contains(filterValue);
        }

        let projects = [...document.querySelectorAll('.project[data-id]')];
        for (let p of projects) {
            let name = p.getAttribute('data-name') || '';
            let matches = matchFunc(name);

            if (matches) {
                p.parentNode.classList.remove(filteredClass);
            } else {
                p.parentNode.classList.add(filteredClass);
            }
        }

        let groups = document.querySelectorAll('.group');
        for (let g of groups) {
            let groupProjects = [...g.querySelectorAll('.project[data-id]')].map(p => p.parentNode);
            let noneMatches = !groupProjects.length || groupProjects.every(p => p.classList.contains(filteredClass));
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