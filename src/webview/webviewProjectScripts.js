function initProjects() {

    function onProjectClicked(projectId, newWindow) {
        window.vscode.postMessage({
            type: 'selected-project',
            projectId,
            newWindow,
        });
    }

    function onAddProjectClicked(e) {
        if (!e.target)
            return;

        var projectDiv = e.target.closest('.project');
        if (!projectDiv)
            return;

        var projectGroupId = projectDiv.getAttribute("data-project-group-id");

        window.vscode.postMessage({
            type: 'add-project',
            projectGroupId,
        });
    }

    function onInsideProjectClick(e, projectDiv) {
        var dataId = projectDiv.getAttribute("data-id");
        if (dataId == null)
            return;

        if (onTriggerProjectAction(e.target, dataId))
            return;

        var newWindow = e.ctrlKey || e.metaKey;
        onProjectClicked(dataId, newWindow);
    }

    function onInsideProjectsGroupClick(e, projectsGroupDiv) {
        var groupId = projectsGroupDiv.getAttribute("data-group-id");
        if (groupId == null)
            return;

        var actionDiv = e.target.closest('[data-action]')
        var action = actionDiv != null ? actionDiv.getAttribute("data-action") : null;
        if (!action)
            return;

        if (action === "add") {
            window.vscode.postMessage({
                type: 'add-project',
                projectGroupId: groupId,
            });

            return;
        }

        if (action === "collapse") {
            projectsGroupDiv.classList.toggle("collapsed");
        }

        window.vscode.postMessage({
            type: action + '-projects-group',
            projectGroupId: groupId,
        });
    }

    function onTriggerProjectAction(target, projectId) {
        var actionDiv = target.closest('[data-action]')
        if (actionDiv == null)
            return false;

        var action = actionDiv.getAttribute("data-action");
        if (!action)
            return false;

        window.vscode.postMessage({
            type: action + '-project',
            projectId,
        });

        return true;
    }

    document.addEventListener('click', function (e) {
        if (!e.target)
            return;

        if (e.target.closest('[data-action="add-projects-group"]')) {
            window.vscode.postMessage({
                type: 'add-projects-group'
            });
            return;
        }

        var projectDiv = e.target.closest('.project');
        if (projectDiv) {
            onInsideProjectClick(e, projectDiv);
            return;
        }

        var projectsGroupDiv = e.target.closest('.projects-group');
        if (projectsGroupDiv) {
            onInsideProjectsGroupClick(e, projectsGroupDiv);
            return;
        }
    });

    document
        .querySelectorAll('[data-action="add-project"]')
        .forEach(element =>
            element.addEventListener("click", onAddProjectClicked)
        );
}