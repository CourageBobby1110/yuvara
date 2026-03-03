const rs = ['Men', 'Clothing > Men', 'Clothing / Men', 'Clothing > Women']; const r = /(^|[\\/>]\s*)Men$/i; console.log(rs.map(s => r.test(s)));
