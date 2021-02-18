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

    if (!filterId) {
      // Hide and clear the results table
      $table.style.display = 'none'
      $table.innerHTML = '';

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
        const statusesCache = result.reduce((memo, { fields: { status } }) => {
          if (status) memo[status.id] = status.name;

          return memo;
        }, {});

        const assigneeCache = result.reduce((memo, { fields: { assignee } }) => {
          if (assignee) memo[assignee.accountId] = assignee.displayName;

          return memo;
        }, {});

        const collection = result.reduce((memo, { id, fields }) => {
          const {
            assignee,
            status
          } = fields;

          const { id: statusId } = status;

          if (!assignee) {
            if (!memo.unknown) memo.unknown = {};
            if (!memo.unknown[statusId]) memo.unknown[statusId] = [];

            memo.unknown[statusId].push(id);
          } else {
            const { accountId } = assignee;

            if (!memo[accountId]) memo[accountId] = {};
            if (!memo[accountId][statusId]) memo[accountId][statusId] = [];

            memo[accountId][statusId].push(id);
          }

          return memo;
        }, {});

        const cols = ['Assignee', ...Object.values(statusesCache)];

        const rows = Object.entries(collection)
          .reduce((memo, [assignee, data]) => {
            const values = Object.keys(statusesCache)
              .map((k) => data[k] || []);

            memo.push([
              assigneeCache[assignee] || 'Unknown',
              ...values
            ]);

            return memo;
          }, []);

        fillTableResult($table, cols, rows);

        $table.style.display = 'block';
      },
      error: () => {
        console.log('error');
      }
    })
  });
});

function fillTableResult ($el, cols, rows) {
  const head = `<td>${cols.join('</td><td>')}</td>`;

  const body = rows.map((row) => {
    console.log(row);

    const cells = row.map((c, i) => {
      if (Array.isArray(c)) {
        return c.length
          ? `<td><a href="${window.baseUrl}/issues/?jql=id in (${c.join()})">${c.length}</a></td>`
          : `<td>${c.length}</td>`;
      }

      return `<td>${c}</td>`;
    });

    return `<tr>${cells.join('')}</tr>`;
  });

  $el.insertAdjacentHTML('afterBegin', `<thead><tr>${head}</tr></thead>`);
  $el.insertAdjacentHTML('beforeEnd', `<tbody>${body}</tbody>`);
}
