import axios from 'axios'
import { observable } from 'mobx';
import { RootStore } from '.';

if (process.env.NODE_ENV === 'development') {
    axios.defaults.baseURL = 'http://localhost:3001/'
}



class ApiStore {
    @observable data: Viz.Data
    @observable ok: boolean = false
    @observable loading: boolean = false
    @observable error: null | Error = null
    @observable root: RootStore
    constructor(store: RootStore) {
        this.root = store
        this.loading = true
        axios.get('/')
            .then(res => {
                this.loading = false
                if (res.status === 200) {
                    this.ok = true
                } else {
                    this.ok = false
                }
            }).catch(e => {
                console.log(e);
                this.loading = false
                this.error = e
            })
    }
    async runCode(code: string, ) {
        try {
            code = '\n' + code + '\n'
            this.loading = true
            const res = await axios.post('/', { code })
            this.loading = false
            const data: Viz.Data = res.data
            this.root.initialize(data)
            window.localStorage.setItem('data', JSON.stringify(data))
        } catch (e) {
            console.log(e)
        }
    }
}

export default ApiStore