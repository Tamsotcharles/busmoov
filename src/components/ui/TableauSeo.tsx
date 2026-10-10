import type { TableauSeo as TableauSeoData } from '@/lib/blog'

/**
 * Tableau de contenu SEO (fourchettes de prix, comparatifs…). Même rendu
 * côté React et côté prérendu (scripts/prerender.mjs, fonction `tableau`) :
 * garder les deux alignés si les classes changent.
 */
export function TableauSeo({ caption, headers, rows }: TableauSeoData) {
  return (
    <div className="overflow-x-auto my-6">
      <table className="w-full text-sm border-collapse">
        {caption && <caption className="text-left text-sm font-semibold text-gray-700 mb-2">{caption}</caption>}
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} className="bg-purple-50 text-left font-semibold text-gray-800 px-3 py-2 border border-gray-200">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
              {row.map((cell, j) => (
                <td key={j} className={`px-3 py-2 border border-gray-200 text-gray-700 ${j === 0 ? 'font-medium whitespace-nowrap' : ''}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
