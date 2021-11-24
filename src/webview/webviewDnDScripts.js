function initDnD() {
    const projectsContainerSelector = ".group-list";
    const groupsContainerSelector = ".groups-wrapper";

    document.body.classList.remove("preload");

    var projectsContainers = document.querySelectorAll(projectsContainerSelector);
    var projectDrake = dragula([].slice.call(projectsContainers), {
        moves: function (el, source, handle, sibling) {
            return !el.hasAttribute("data-nodrag");
        },
    });
    projectDrake.on('drop', onReordered);
    projectDrake.on('drag', () => document.body.classList.add('project-dragging'));
    projectDrake.on('dragend', () => document.body.classList.remove('project-dragging'));

    var groupsContainers = document.querySelectorAll(groupsContainerSelector);
    var groupsDrake = dragula([].slice.call(groupsContainers), {
        moves: function (el, source, handle, sibling) {
            return handle.hasAttribute("data-drag-group");
        },
    });
    groupsDrake.on('drop', onReordered);

    const scroll = autoScroll(window, {
        margin: 20,
        autoScroll: function () {
            return this.down && (projectDrake.dragging || groupsDrake.dragging);
        }
    });

    window.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            projectDrake.cancel(true);
            groupsDrake.cancel(true);
        }
    });

    function onReordered() {
        // Build reordering object
        let groupElements = [...document.querySelectorAll(`${groupsContainerSelector} > [data-group-id]`)];
        // If a project was dropped on the Create New Group element...
        let tempGroupElement = document.querySelector('#tempGroup');
        if (tempGroupElement && tempGroupElement.querySelector("[data-id]")) {
            // ... Handle it as a new group
            groupElements.push(tempGroupElement);
        }

        let groupOrders = [];
        for (let groupElement of groupElements) {
            var groupOrder = {
                groupId: groupElement.getAttribute("data-group-id") || "",
                projectIds: [].slice.call(groupElement.querySelectorAll("[data-id]")).map(p => p.getAttribute("data-id")),
            };
            groupOrders.push(groupOrder);
        }

        window.vscode.postMessage({
            type: 'reordered-projects',
            groupOrders,
        });
    }
};