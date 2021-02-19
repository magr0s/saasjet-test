$(document).ready(function () {
  const $filter = document.querySelector('#filter-select');
  const $table = document.querySelector('#filter-result');

  // Click logger
  $table.addEventListener('click', (e) => {
    const {
      href,
      tagName
    } = e.target;

    if (tagName === 'A') {
      e.preventDefault();

      $.ajax({
        method: 'post',
        url: '/api/click-logger',
        data: {
          jwt: window.jwt,
          event: 'LINK_CLICK'
        }
      })
        .done(() => window.top.location.href = href);
    }
  });

  $filter.addEventListener('change', (evt) => {
    const { value: filterId } = evt.target;

    // Hide and clear the results table
    $table.style.display = 'none'
    $table.innerHTML = '';

    if (!filterId) {
      return ;
    }

    // Get the filter result
    $.ajax({
      url: '/api/filter-result',
      data: {
        jwt: window.jwt,
        filterId
      },
      success: ({ result }) => {
        const {
          issues,
          statuses,
          filter
        } = result;

        const assigneeCache = issues.reduce((memo, { fields: { assignee } }) => {
          if (assignee) memo[assignee.accountId] = assignee.displayName;

          return memo;
        }, {});

        const collection = issues.reduce((memo, { id, fields }) => {
          const {
            assignee,
            status
          } = fields;

          const { id: statusId } = status;
          const assigneeId = !assignee ? assignee.accountId : '[FREE]';

          if (!memo[assigneeId])
            memo[assigneeId] = {};

          if (!memo[assigneeId][statusId])
            memo[assigneeId][statusId] = [];

          memo[assigneeId][statusId].push(id);

          return memo;
        }, {});

        const cols = [
          'Assignee',

          ...statuses.map(({ name }) => name)
        ];

        const rows = Object.entries(collection)
          .reduce((memo, [assignee, data]) => {
            const values = statuses.map(({ id }) => data[id] || 0);

            memo.push([
              assigneeCache[assignee] || 'Unknown',
              ...values
            ]);

            return memo;
          }, []);

        fillTableResult($table, cols, rows);

        $table.style.display = 'block';
      },
      error: (err) => console.log(err)
    })
  });
});

function fillTableResult ($el, cols, rows) {
  const head = `<td>${cols.join('</td><td>')}</td>`;

  const body = rows.map((row) => {
    const cells = row.map((c) =>
      (Array.isArray(c))
        ? `<td><a href="${window.baseUrl}/issues/?jql=id in (${c.join()})">${c.length}</a></td>`
        : `<td>${c}</td>`
    );

    return `<tr>${cells.join('')}</tr>`;
  });

  $el.insertAdjacentHTML('afterBegin', `<thead><tr>${head}</tr></thead>`);
  $el.insertAdjacentHTML('beforeEnd', `<tbody>${body.join('')}</tbody>`);
}
