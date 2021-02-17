$(document).ready(function () {
  const $filter = document.querySelector('#filter-select');
  const $table = document.querySelector('#filter-result');

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

        const collection = result.reduce((memo, { fields }) => {
          const {
            assignee,
            status
          } = fields;

          const { id: statusId } = status;

          if (!assignee) {
            if (!memo.unknown) memo.unknown = {};

            memo.unknown[statusId]
              ? memo.unknown[statusId]++
              : memo.unknown[statusId] = 1;
          } else {
            const { accountId } = assignee;

            if (!memo[accountId]) memo[accountId] = {};

            memo[accountId][statusId]
              ? memo[accountId][statusId]++
              : memo[accountId][statusId] = 1;
          }

          return memo;
        }, {});

        console.log(statusesCache);

        const cols = ['Assignee', ...Object.values(statusesCache)];

        const rows = Object.entries(collection)
          .reduce((memo, [assignee, data]) => {
            console.log(data);

            const values = Object.keys(statusesCache)
              .map((k) => data[k] || 0)

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
  const head = `<td>${cols.join('</td><td>')}</td>`

  const body = rows.map((row) => {
    const cells = row.map(c => `<td>${c}</td>`);

    return `<tr>${cells.join('')}</tr>`;
  });

  $el.insertAdjacentHTML('afterBegin', `<thead><tr>${head}</tr></thead>`);
  $el.insertAdjacentHTML('beforeEnd', `<tbody>${body}</tbody>`);
}
