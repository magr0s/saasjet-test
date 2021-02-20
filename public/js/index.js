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

        const jqlQuery = [filter.jql];

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
          const assigneeId = assignee ? assignee.accountId : '[FREE]';

          if (!memo[assigneeId])
            memo[assigneeId] = {};

          if (!memo[assigneeId][statusId])
            memo[assigneeId][statusId] = 0;

          memo[assigneeId][statusId] += 1;

          return memo;
        }, {});

        const cols = [
          'Assignee',

          ...statuses.map(({ name }) => name)
        ];

        const rows = Object.entries(collection)
          .reduce((memo, [assignee, data]) => {
            const assigneeName = assigneeCache[assignee];

            assigneeName &&
              jqlQuery.push(`assignee = ${assignee}`);

            const cells = statuses.map(({ id }) => {
              let jql = [...jqlQuery, `status = ${id}`]
                .reverse()
                .join(' AND ');

              // TODO:
              const sanitizeJQL = (str) => str.replace('AND ORDER BY', 'ORDER BY');

              return Number(!!data[id]) && {
                value: data[id],
                jql: sanitizeJQL(jql)
              }
            });

            memo.push([
              assigneeName || '[FREE]',
              ...cells
            ]);

            return memo;
          }, []);

        resultTableRenderer($table, cols, rows);

        $table.style.display = 'block';
      },
      error: (err) => console.log(err)
    })
  });
});

function resultTableRenderer ($el, cols, rows) {
  const cell = (value) => `<td>${value}</td>`;
  const cellWithLink = ({ value, jql }) => cell(`<a href="${window.baseUrl}/issues/?jql=${jql}">${value}</a>`);

  const thead = `<thead><tr><td>${cols.join('</td><td>')}</td></tr></thead>`;
  const body = rows.map((row) =>
    '<tr>' +
    row.map(c =>
      (!c || typeof (c) !== 'object') ? cell(c) : cellWithLink(c)) +
    '</tr>'
  );

  const table = `${thead}<tbody>${body.join('')}</tbody>`

  $el.insertAdjacentHTML('beforeEnd', table);
}
