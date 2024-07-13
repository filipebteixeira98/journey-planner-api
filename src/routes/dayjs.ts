import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import 'dayjs/locale/en'

dayjs.locale('en')

dayjs.extend(localizedFormat)

export { dayjs }
