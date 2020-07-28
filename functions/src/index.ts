import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
admin.initializeApp()


import {Canvas, registerFont} from 'canvas'
// @ts-ignore
import * as Konva from 'konva-node' // TODO: 型定義がうまくできない
import { createHash } from 'crypto'

const mimeType = 'image/jpeg'
const imagePath = 'images'

interface RequestBody {
    text: string
}

registerFont('static/NotoSansCJKjp-Regular.otf', {
    family: 'Noto'
})

const isRequestBody = (data: any): data is RequestBody =>
    data !== null && typeof data.text === 'string'


export const createImage = functions
    .region('asia-northeast1')
    .https.onCall(async (data, context) => {
        if (!isRequestBody(data)) {
            return
        }

        const stage = new Konva.Stage({
            width: 500,
            height: 500,
            container: undefined as unknown as string
        })
        const layer = new Konva.Layer()

        const rect = new Konva.Rect({
            x: 0,
            y: 0,
            width: 500,
            height: 500,
            fill: 'white'
        });
        layer.add(rect);

        const text = new Konva.Text({
            x: 0,
            y: 0,
            width: 500,
            height: 500,
            fontSize: 77,
            lineHeight: 1.5,
            padding: 70,
            align: 'center',
            verticalAlign: 'middle',
            fontFamily: 'Noto',
            text: data.text
        })

        await layer.add(text)
        await stage.add(layer)


        const textHash = createHash('sha256')
            .update(data.text)
            .digest('hex')
        const fileName = `${textHash}.jpeg`

        const buffer = (stage.toCanvas(null) as unknown as Canvas)
            .toBuffer(mimeType)

        await admin
            .storage()
            .bucket()
            .file(`${imagePath}/${fileName}`)
            .save(buffer, {
                contentType: mimeType,
                public: true
            })

        return buffer.toString('base64')
    })
