var myObserver
var cachedSelectedIssue
var oneIssuePage

oneIssuePage = null

getRecordTitle = (issueID) => {
  if (oneIssuePage) {
    return document.title.replace(/ - Jira/i, "")
  }

  return `[${issueID}]`
}

renderToNode = (node) => {
    const selectedIssue = node.textContent
    if (node.parentNode.dataset.clockify) { return }

    node.parentNode.dataset.clockify = true

    let tags = []
    let parents = []
    for (let issueTag = node.parentNode; Boolean(issueTag); issueTag = issueTag.parentNode) {
        tags.push(issueTag.tagName)
        parents.push(issueTag)
    }

    while (tags.includes('A')) {
        tags.shift()
        parents.shift()
    }

    const container = parents[0]
    let link = clockifyButton.createButton({
        description: getRecordTitle(selectedIssue),
        projectName: 'project',
        taskName: selectedIssue
    })
    link.style.paddingLeft = "6px";
    container.appendChild(link)
}

cachedSelectedIssue = null

getSelectedIssue = () => {
  let searchParams = new URLSearchParams(window.location.search)
  let selectedIssue = searchParams.get('selectedIssue')

  if (!selectedIssue) {
    const match = window.location.pathname.match(/^\/browse\/([A-Z0-9\-]+)$/)
    if (match && match[1]) {
      selectedIssue = match[1]
      oneIssuePage = true
    }
  }

  if (cachedSelectedIssue && (cachedSelectedIssue !== selectedIssue)) {
    if (document.querySelector("[data-clockify='true']")) {
      document.querySelectorAll("[data-clockify='true']").forEach((el) => {
        const button = el.querySelector('#clockifyButton')
        if (button) { button.remove() }
        delete el.dataset.clockify
      })
    }
  }

  cachedSelectedIssue = selectedIssue

  return selectedIssue
}

findNodesWithText = (text, parent) => (
  document.evaluate( `.//*[text()='${text}']`, parent, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null)
)

findNodeWithText = (text, parent) => (
  document.evaluate( `.//*[text()='${text}']`, parent, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
)

initialPageScan = () => {
  const selectedIssue = getSelectedIssue()
  if (!selectedIssue) { return }

  const iter = findNodesWithText(selectedIssue, document.body)
  const nodeArray = []
  for (let node = iter.iterateNext(); node !== null; node = iter.iterateNext()) {
    nodeArray.push(node)
  }
  nodeArray.map(renderToNode)
}

if (!myObserver) {
  initialPageScan()

  myObserver = new MutationObserver((mutations) => {
    const selectedIssue = getSelectedIssue()
    if(!selectedIssue) { return }

    const mapedNodes = mutations.filter(
      ({ type, addedNodes }) => (type === 'childList' && addedNodes.length > 0)
    ).map(
      ({ target}) => (
        findNodeWithText(selectedIssue, target)
      )
    ).filter(Boolean)

    if (!mapedNodes.length) {
      return;
    }

    const unique = [...new Set(mapedNodes)]

    unique.map(renderToNode)
  });

  myObserver.observe(
    document,
    {childList: true, subtree: true}
  );
}

// Confluence
// setTimeout(() => {
// clockifyButton.render(
//   '#content-header-container:not(.clockify)',
//   { observe: true },
//   (elem) => {
//     let link,
//     container = createTag('div', 'button-link notion-tb-wrapper'),
//     clockifyButtonLoc = $(
//       '[data-test-id="content-buttons"]'
//       );
//     if (document.getElementById('clockifyButton')) {
//         document.getElementById('clockifyButton').remove();
//     }
//     link = clockifyButton.createButton(document.title);
//     link.style.cursor = 'pointer';
//     container.appendChild(link);
//     clockifyButtonLoc.parentElement.parentNode.firstChild.before(container);
//   }
// );
// }, 1000);