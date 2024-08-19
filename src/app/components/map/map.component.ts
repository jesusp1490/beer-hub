import { Component, OnInit } from '@angular/core';
import { tileLayer, latLng, Map, marker, icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.sass']
})
export class MapComponent implements OnInit {

  map!: Map;

  constructor() { }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {
    this.map = new Map('map', {
      center: latLng(20, 0),
      zoom: 2
    });

    tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(this.map);

    // Example of adding a marker
    marker([51.5, -0.09], {
      icon: icon({
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
        iconUrl: 'assets/marker-icon.png', // Add a marker icon if needed
        shadowUrl: 'assets/marker-shadow.png'
      })
    })
    .addTo(this.map)
    .bindPopup('<b>Hello world!</b><br>I am a popup.')
    .openPopup();
  }
}
